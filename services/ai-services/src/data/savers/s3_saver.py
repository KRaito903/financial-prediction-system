import boto3
from src.data.savers.base_saver import DataSaverStrategy


class S3Saver(DataSaverStrategy):
    def __init__(self, aws_access_key_id: str, aws_secret_access_key: str, bucket_name: str):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
        self.bucket_name = bucket_name


    def save_data(self,  **kwargs) -> None:
        """
        Lưu thằng dataframe thành file csv thôi ở dang folder tuỳ chỉnh maybe nó ở craw
        file_path => đường dẫn lưu file raw csv
        """
        try:
            local_file_path = kwargs.get("file_path", "output.csv")
            self.s3_client.upload_file(local_file_path, self.bucket_name, local_file_path)
            print(f"File '{local_file_path}' uploaded to S3 bucket '{self.bucket_name}' successfully.")
        except Exception as e:
            print(f"Error uploading file to S3: {e}")
