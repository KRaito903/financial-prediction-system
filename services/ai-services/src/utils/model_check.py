import yaml
import requests

CONFIG_PATH = "configs/main_config.yaml"
MODEL_PATH = "models/timexer/day/"


def check_model_exists(model_name: str, pred_len: int) -> bool:
    with open(CONFIG_PATH, "r") as f:
        config = yaml.safe_load(f)
    model_name = "timexer" #to testing
    url = f"{config['cloudfront_url']}{MODEL_PATH}{model_name}_pred_{pred_len}.ckpt"
    print(f"Checking model at URL: {url}")
    try:
        response = requests.head(url, allow_redirects=True, timeout=5)
        return response.status_code == 200
    except Exception as e:
        print(f"Error checking model existence: {e}")
        return False
