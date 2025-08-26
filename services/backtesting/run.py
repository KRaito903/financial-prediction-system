import os
import click
from dotenv import load_dotenv
load_dotenv()

@click.group()
def cli():
    """Commands to run the backtesting service."""
    pass

@cli.command()
@click.option('--port', default=5050, help='Port to run the server on')
@click.option('--reload/--no-reload', default=True, help='Enable auto-reload')
@click.option('--host', default='127.0.0.1', help='Host to bind the server to') # Changed default host to localhost for dev
def dev(port, reload, host):
    """Run the backtesting service in development mode."""
    reload_flag = "--reload" if reload else ""
    os.system(f"uvicorn src.services.backtest_API:app --host {host} {reload_flag} --port {port}")

@cli.command()
@click.option('--port', default=5050, help='Port to run the server on')
@click.option('--host', default='0.0.0.0', help='Host to bind the server to')
def prod(port, host):
    """Run the backtesting service in production mode."""
    os.system(f"uvicorn src.services.backtest_API:app --host {host} --port {port}")

if __name__ == '__main__':
    cli()