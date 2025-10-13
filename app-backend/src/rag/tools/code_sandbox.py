from langchain_core.tools import tool
import jupyter_client

@tool
def code_interpreter(code: str, timeout: int = 60) -> dict:
    """
    Executes Python code in a new isolated Jupyter kernel (a local sandbox).
    Python version used: 3.10.

    Args:
        code: The Python code string to execute.
        timeout: The maximum time in seconds to wait for execution to finish.

    Returns:
        A dictionary containing 'stdout' (standard output), 'stderr' (errors),
        and 'result' (the result of the last expression, if any).
    """
    km = jupyter_client.KernelManager()
    try:
        km.start_kernel()

        client = km.client()
        client.start_channels()
        client.wait_for_ready(timeout=timeout)

        stdout_output = []
        stderr_output = []
        execution_result = None

        try:
            msg_id = client.execute(code)
            reply = client.get_shell_msg(timeout=timeout)

            if reply and reply['msg_type'] == 'execute_reply':
                status = reply['content']['status']

                if status == 'ok':
                    # Collect all outputs (stdout, stderr, results, etc.)
                    while True:
                        try:
                            msg = client.get_iopub_msg(timeout=1)
                            msg_type = msg['msg_type']
                            content = msg['content']

                            if msg_type == 'stream':
                                if content['name'] == 'stdout':
                                    stdout_output.append(content['text'])
                                elif content['name'] == 'stderr':
                                    stderr_output.append(content['text'])
                            elif msg_type == 'display_data' or msg_type == 'execute_result':
                                # For simplicity, we take the textual representation
                                if 'data' in content and 'text/plain' in content['data']:
                                    execution_result = content['data']['text/plain']
                            elif msg_type == 'status' and content['execution_state'] == 'idle':
                                # The kernel is idle, execution is probably finished
                                break
                        except TimeoutError:
                            # No more messages for now, exit if we've already processed the main reply
                            break
                elif status == 'error':
                    stderr_output.append(f"Error type: {reply['content'].get('ename')}\n")
                    stderr_output.append(f"Error value: {reply['content'].get('evalue')}\n")
                    stderr_output.extend(reply['content'].get('traceback', []))
            else:
                stderr_output.append(f"No valid execution reply received or timeout. Reply: {reply}")

        except TimeoutError:
            stderr_output.append(f"Code execution exceeded the timeout of {timeout} seconds.")
        except Exception as e:
            stderr_output.append(f"An unexpected error occurred while interacting with the kernel: {e}")
        finally:
            print("Stopping client channels.")
            client.stop_channels()

    except Exception as e:
        stderr_output.append(f"Unable to start or interact with the Jupyter kernel: {e}")
    finally:
        if km.is_alive():
            print("Shutting down Jupyter kernel.")
            km.shutdown_kernel(now=True)
        else:
            print("The Jupyter kernel was not active or has already been stopped.")

    return {
        "stdout": "".join(stdout_output).strip(),
        "stderr": "".join(stderr_output).strip(),
        "result": execution_result.strip() if execution_result else None
    }