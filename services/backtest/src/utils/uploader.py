import uuid
from typing import Optional, Dict, Any
from pathlib import Path
import aiofiles
from fastapi import UploadFile, HTTPException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelUploader:
    """Handles ML model file uploads and storage."""

    def __init__(self, storage_dir: str = "storage"):
        """
        Initialize the model uploader.

        Args:
            storage_dir: Directory to store uploaded models (relative to project root)
        """
        self.project_root = Path(__file__).parent.parent.parent
        self.storage_dir = self.project_root / storage_dir
        self._ensure_storage_dir()

    def _ensure_storage_dir(self):
        """Ensure the storage directory exists."""
        try:
            self.storage_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Storage directory created/verified: {self.storage_dir}")
        except Exception as e:
            logger.error(f"Failed to create storage directory: {e}")
            raise

    async def upload_model(
        self, file: UploadFile, user_id: str, model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Upload an ML model file.

        Args:
            file: The uploaded file
            user_id: ID of the user uploading the model
            model_name: Optional custom name for the model

        Returns:
            Dict containing upload information including file path
        """
        try:
            # Validate file type
            if not file.filename or not self._is_valid_model_file(file.filename):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only .pkl, .joblib, .h5, .pb, and .onnx files are allowed.",
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

            # Create user-specific directory
            user_dir = self.storage_dir / user_id
            user_dir.mkdir(exist_ok=True)

            # Full file path
            file_path = user_dir / filename

            # Save the file
            async with aiofiles.open(file_path, "wb") as buffer:
                content = await file.read()
                await buffer.write(content)

            # Get file info
            file_size = len(content)
            file_info = {
                "filename": filename,
                "original_filename": file.filename or "unknown",
                "file_path": str(file_path),
                "relative_path": str(file_path.relative_to(self.project_root)),
                "file_size": file_size,
                "user_id": user_id,
                "model_name": model_name
                or (Path(file.filename).stem if file.filename else "unknown"),
                "file_extension": file_extension,
                "upload_timestamp": str(
                    uuid.uuid4()
                ),  # Could be replaced with actual timestamp
            }

            logger.info(f"Model uploaded successfully: {file_path}")
            return file_info

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to upload model: {e}")
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

    def get_user_models(self, user_id: str) -> list:
        """
        Get list of models uploaded by a user.

        Args:
            user_id: ID of the user

        Returns:
            List of model information
        """
        try:
            user_dir = self.storage_dir / user_id
            if not user_dir.exists():
                return []

            models = []
            for file_path in user_dir.glob("*"):
                if file_path.is_file():
                    stat = file_path.stat()
                    models.append(
                        {
                            "filename": file_path.name,
                            "file_path": str(file_path),
                            "relative_path": str(
                                file_path.relative_to(self.project_root)
                            ),
                            "file_size": stat.st_size,
                            "created_time": stat.st_ctime,
                            "modified_time": stat.st_mtime,
                        }
                    )

            return models

        except Exception as e:
            logger.error(f"Failed to get user models: {e}")
            return []

    def delete_model(self, user_id: str, filename: str) -> bool:
        """
        Delete a model file.

        Args:
            user_id: ID of the user
            filename: Name of the file to delete

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            user_dir = self.storage_dir / user_id
            file_path = user_dir / filename

            if file_path.exists() and file_path.is_file():
                file_path.unlink()
                logger.info(f"Model deleted: {file_path}")
                return True
            else:
                logger.warning(f"Model not found: {file_path}")
                return False

        except Exception as e:
            logger.error(f"Failed to delete model: {e}")
            return False

    def get_model_path(self, user_id: str, filename: str) -> Optional[str]:
        """
        Get the full path to a model file.

        Args:
            user_id: ID of the user
            filename: Name of the model file

        Returns:
            Full path to the model file or None if not found
        """
        try:
            user_dir = self.storage_dir / user_id
            file_path = user_dir / filename

            if file_path.exists() and file_path.is_file():
                return str(file_path)
            else:
                return None

        except Exception as e:
            logger.error(f"Failed to get model path: {e}")
            return None


# Global uploader instance
uploader = ModelUploader()