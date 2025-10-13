import io
import boto3
from botocore.exceptions import NoCredentialsError
from models.s3.utils import generate_s3_object_name

from typing import Literal
from dotenv import load_dotenv
from config.config import CONFIG
load_dotenv()

# CONFIG = {
#     "S3_BUCKET_NAME": "the-universal-agent"
# }


def upload_files_to_s3(file_content: bytes, file_name: str, content_type: str = "text/plain", role: Literal["upload", "generation"]= "upload") -> str | None:
    """
    Charge des données binaires (bits) directement depuis la mémoire vers un bucket S3.
 
    :param file_content: Les données binaires à charger (bytes).
    :param file_name: Nom du fichier dans S3.
    :param content_type: Type de contenu (MIME type) de l'objet. Ex: 'text/plain', 'image/jpeg'.
                         Si non spécifié, S3 peut essayer de le deviner.
    """
    s3 = boto3.client('s3')
    file_obj = io.BytesIO(file_content)
    #new_name = os.path.splitext(os.path.basename(file_name))[0] + "-" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S_") + os.path.splitext(os.path.basename(file_name))[-1]
    object_name = generate_s3_object_name(file_name, content_type)

    try:
        extra_args = {
            'StorageClass': "STANDARD_IA" # Standard - Infrequent Access
        }
        if content_type:
            #new_name = str.split(content_type, "/")[0] + "-" + new_name
            extra_args['ContentType'] = content_type
        
        #new_name = new_name.replace(" ", "_").lower()

        folder_name = "user_upload/" if role == "upload" else "generated/"
        s3.upload_fileobj(file_obj, CONFIG.S3_BUCKET_NAME, folder_name + object_name, ExtraArgs=extra_args)
        print(f"Données chargées avec succès vers {CONFIG.S3_BUCKET_NAME}/{folder_name}{object_name}")
        return object_name

    except NoCredentialsError:
        print("Identifiants AWS non trouvés. Assurez-vous qu'ils sont configurés.")

    except Exception as e:
        print(f"Une erreur est survenue lors du chargement : {e}")


if __name__ == "__main__":
    mon_contenu_binaire = "Ceci est le contenu de mon fichier, encodé en bytes.".encode('utf-8')
    
    nom_objet_s3 = "complete.txt"
    mon_content_type = "text/plain"
 
    upload_files_to_s3(mon_contenu_binaire, nom_objet_s3, mon_content_type)
