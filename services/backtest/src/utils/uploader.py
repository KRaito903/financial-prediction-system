import uuid
import os
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
from dotenv import load_dotenv
from fastapi import UploadFile, HTTPException
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Singleton Supabase client
URL: str = os.getenv("SUPABASE_URL", "")
KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE: Client = create_client(URL, KEY)


class ModelUploader:
    """Handles ML model file uploads and storage using Supabase."""

    def __init__(self, bucket_name: str = "ml_models"):
        """
        Initialize the model uploader with Supabase storage.

        Args:
            bucket_name: Name of the Supabase storage bucket to use
        """
        self.bucket_name = bucket_name
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure the Supabase storage bucket exists."""
        try:
            # Get list of buckets
            buckets = SUPABASE.storage.list_buckets()
            bucket_exists = any(bucket.name == self.bucket_name for bucket in buckets)

            # Create bucket if it doesn't exist
            if not bucket_exists:
                SUPABASE.storage.create_bucket(self.bucket_name)
                logger.info(f"Created Supabase storage bucket: {self.bucket_name}")
            else:
                logger.info(
                    f"Using existing Supabase storage bucket: {self.bucket_name}"
                )
        except Exception as e:
            logger.error(f"Failed to set up Supabase storage bucket: {e}")
            raise

    async def upload_model(
        self, file: UploadFile, user_id: str, model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload an ML model file to Supabase storage.

        Args:
            file: The uploaded file
            user_id: ID of the user uploading the model
            model_name: Optional custom name for the model

        Returns:
            Dict containing upload information
        """
        try:
            # Validate file type
            if not file.filename or not self._is_valid_model_file(file.filename):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only .pkl, .joblib, .h5, .pb, .onnx, .pt, and .pth files are allowed.",
                )

            # Generate unique filename
            file_extension = Path(file.filename).suffix
            unique_id = str(uuid.uuid4())
            if model_name:
                safe_name = "".join(
                    c for c in model_name if c.isalnum() or c in (" ", "-", "_")
                ).rstrip()
                filename = f"{user_id}_{safe_name}_{unique_id}{file_extension}"
            else:
                original_name = Path(file.filename).stem
                safe_name = "".join(
                    c for c in original_name if c.isalnum() or c in (" ", "-", "_")
                ).rstrip()
                filename = f"{user_id}_{safe_name}_{unique_id}{file_extension}"

            # Define the storage path - store in user-specific folder
            storage_path = f"{user_id}/{filename}"

            # Read file content
            content = await file.read()
            file_size = len(content)
            # Upload to Supabase
            SUPABASE.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=content,
            )

            # Get file URL (signed URL that expires)
            file_url = SUPABASE.storage.from_(self.bucket_name).create_signed_url(
                path=storage_path,
                expires_in=3600,  # URL expires in 1 hour
            )

            # File information
            file_info = {
                "filename": filename,
                "original_filename": file.filename or "unknown",
                "storage_path": storage_path,
                "file_url": file_url,
                "file_size": file_size,
                "user_id": user_id,
                "model_name": model_name
                or (Path(file.filename).stem if file.filename else "unknown"),
                "file_extension": file_extension,
                "upload_timestamp": str(
                    uuid.uuid4()
                ),  # Could be replaced with actual timestamp
            }

            logger.info(
                f"Model uploaded successfully to Supabase storage: {storage_path}"
            )
            return file_info

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload model to Supabase: {e}")
            raise HTTPException(
                status_code=500, detail=f"Failed to upload model: {str(e)}"
            )

    def _is_valid_model_file(self, filename: str) -> bool:
        """
        Check if the file is a valid ML model file.

        Args:
            filename: Name of the file to check

        Returns:
            True if valid, False otherwise
        """
        if not filename:
            return False

        valid_extensions = {".pkl", ".joblib", ".h5", ".pb", ".onnx", ".pt", ".pth"}
        file_extension = Path(filename).suffix.lower()

        return file_extension in valid_extensions

    def get_user_models(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get list of models uploaded by a user.

        Args:
            user_id: ID of the user

        Returns:
            List of model information
        """
        try:
            # List files in the user's directory
            user_path = f"{user_id}/"
            file_list = SUPABASE.storage.from_(self.bucket_name).list(path=user_path)

            models = []
            for file_info in file_list:
                if isinstance(file_info, dict):
                    file_path = f"{user_id}/{file_info.get('name', '')}"

                    # Generate temporary URL with read access
                    temp_url = SUPABASE.storage.from_(
                        self.bucket_name
                    ).create_signed_url(
                        path=file_path,
                        expires_in=3600,  # URL expires in 1 hour
                    )

                    # Get metadata safely
                    metadata = file_info.get("metadata", {})
                    metadata = metadata if isinstance(metadata, dict) else {}

                    models.append(
                        {
                            "filename": file_info.get("name", ""),
                            "storage_path": file_path,
                            "file_url": temp_url,
                            "file_size": metadata.get("size", 0),
                            "created_time": metadata.get("createdAt", ""),
                            "last_modified": metadata.get("updatedAt", ""),
                        }
                    )

            return models
        except Exception as e:
            logger.error(f"Failed to get user models from Supabase: {e}")
            return []

    def delete_model(self, user_id: str, filename: str) -> bool:
        """
        Delete a model file from Supabase storage.

        Args:
            user_id: ID of the user
            filename: Name of the file to delete

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            storage_path = f"{user_id}/{filename}"

            # Check if file exists before attempting deletion
            try:
                SUPABASE.storage.from_(self.bucket_name).get_public_url(
                    path=storage_path
                )
            except Exception:
                logger.warning(f"Model not found in Supabase: {storage_path}")
                return False

            # Delete the file
            SUPABASE.storage.from_(self.bucket_name).remove(paths=[storage_path])
            logger.info(f"Model deleted from Supabase: {storage_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete model from Supabase: {e}")
            return False

    def get_model_path(self, user_id: str, filename: str) -> Optional[str]:
        """
        Get a signed URL for a model file.

        Args:
            user_id: ID of the user
            filename: Name of the model file

        Returns:
            Signed URL to access the model file or None if not found
        """
        try:
            storage_path = f"{user_id}/{filename}"

            # Generate signed URL that allows temporary access
            signed_url_response = SUPABASE.storage.from_(
                self.bucket_name
            ).create_signed_url(
                path=storage_path,
                expires_in=3600,  # URL expires in 1 hour
            )

            # Extract the string URL from the response object
            if (
                isinstance(signed_url_response, dict)
                and "signedURL" in signed_url_response
            ):
                return signed_url_response["signedURL"]
            elif hasattr(signed_url_response, "signedURL"):
                return signed_url_response.signedURL
            else:
                # Convert to string as fallback
                return str(signed_url_response)

        except Exception as e:
            logger.error(f"Failed to get model URL from Supabase: {e}")
            return None


# Global uploader instance
uploader = ModelUploader()
