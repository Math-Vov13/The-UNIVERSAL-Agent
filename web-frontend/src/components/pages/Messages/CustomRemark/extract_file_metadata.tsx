import { visit } from 'unist-util-visit';

// First, let's define a basic structure for any node in the AST
interface CustomASTNode {
    type: string; // Every node has a type, like 'root', 'paragraph', 'code', etc.
    children?: CustomASTNode[]; // Many nodes can have children (e.g., a paragraph has text nodes)
    // You can add other common properties here if your plugin uses them across different node types
}


interface CustomCodeNode extends CustomASTNode {
    type: 'code'; // This node specifically has the type 'code'
    value: string; // The actual content of the code block
    lang?: string; // The language of the code block (e.g., 'typescript', 'javascript')
    meta?: string; // This is the crucial part for you! It holds extra metadata like your filename.
    data?: { // This is where `remark` often stores additional data for rendering
        hProperties?: { // These are properties that will be passed to the HTML element
            [key: string]: unknown; // Allows for dynamic properties like 'data-filename'
        };
    };
}

function extractFilename(metaString: string | undefined): string | undefined {
    if (!metaString) {
        return undefined;
    }
    const match = metaString.match(/filename="([^"]+)"/);
    return match ? match[1] : undefined;
}

export default function remarkExtractFilename() {
    return (tree: CustomASTNode) => {
        visit(tree, 'code', (node: CustomCodeNode) => {
            const filename = extractFilename(node.meta);
            if (filename) {
                if (!node.data) {
                    node.data = {};
                }
                if (!node.data.hProperties) {
                    node.data.hProperties = {};
                }
                node.data.hProperties['data-filename'] = filename;
            }
        });
    };
}