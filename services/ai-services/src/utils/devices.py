import os
import torch

def get_device():
    # Force CPU in Docker environment
    if os.getenv('DOCKER_ENV') == '1':
        return torch.device('cpu')
    
    # Local development với auto-detection
    if torch.cuda.is_available():
        return torch.device('cuda')
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        # Disable MPS nếu có vấn đề
        if os.getenv('PYTORCH_DISABLE_MPS') == '1':
            return torch.device('cpu')
        return torch.device('mps')
    else:
        return torch.device('cpu')