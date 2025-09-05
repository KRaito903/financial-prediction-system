#!/bin/bash
cd src

flask run -h $FLASK_HOST -p $FLASK_PORT

tail -f /dev/null