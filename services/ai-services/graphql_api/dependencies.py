from concurrent.futures import ThreadPoolExecutor

# Threadpool để xử lý hàm blocking (train, predict)
executor = ThreadPoolExecutor(max_workers=4)
