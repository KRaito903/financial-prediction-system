import os
import sys
import click

@click.group()
def cli():
    """Commands to run the backtesting service."""
    pass

@cli.command()
@click.option('--port', default=5050, help='Port to run the server on')
@click.option('--reload/--no-reload', default=True, help='Enable auto-reload')
def dev(port, reload):
    """Run the backtesting service in development mode."""
    reload_flag = "--reload" if reload else ""
    os.system(f"uvicorn src.services.backtestAPI:app {reload_flag} --port {port}")

@cli.command()
@click.option('--port', default=5050, help='Port to run the server on')
def prod(port):
    """Run the backtesting service in production mode."""
    os.system(f"uvicorn src.services.backtestAPI:app --port {port}")

if __name__ == '__main__':
    cli()