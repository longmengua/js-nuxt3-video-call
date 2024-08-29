#!/bin/bash

# Function to display an error message and exit
function display_error {
    echo "Error: $1"
    exit 1
}

# Function to perform steps common to both scripts
function common_steps {
    # Step 1
    echo "===> Start pull code from branch $1"
    git fetch
    git checkout $1
    git pull

    # Step 2
    echo "===> Check version in package.json"
    json_file="./package.json"
    if [ ! -f "$json_file" ]; then
        display_error "File not found: $json_file"
    fi

    version=$(grep '"version":' "$json_file" | sed -E 's/.*"version": *"([^"]+).*/\1/')
    echo -e "\nVersion: $version\n"
}

# Function to perform deployment steps
function deploy_steps {
    PORT=80
    if [ $1 == "dev" ]; then
        NAME=web-dev
        ENV_FILE_NAME=.env.dev
    elif [ $1 == "uat" ]; then
        NAME=web-uat
        ENV_FILE_NAME=.env.uat
    elif [ $1 == "prod" ]; then
        NAME=web-prod
        ENV_FILE_NAME=.env.prod
    else
        display_error "Unsupported environment: $1, options: dev, uat, prod"
    fi

    DOCKERFILE_NAME=dockerfile.ssr

    # Step 3
    echo "===> Start building"
    docker build \
        -f $DOCKERFILE_NAME \
        --build-arg PAT="$3" \
        --build-arg ENV_FILE_NAME=$ENV_FILE_NAME \
        --build-arg APP_ENV="$1" \
        -t $NAME .

    # Check if docker build failed
    if [ $? -ne 0 ]; then
        display_error "Docker build failed. Check the error message above for details."
    fi

    # Step 4
    echo "===> Start deploying"
    docker rm -f $NAME \
        && docker run -d -p $PORT:3000 --name $NAME $NAME

    # Step 5
    echo "===> Clean cache of container and volume"
    # if [ $1 == "prod" ]; then
        # docker volume prune -f
        # docker container prune -f
    # else
        # docker system prune -af
    # fi
}

# Assign argument to a variable
branch=$1
render=$2
pat=$3

# Perform common steps
common_steps $branch

# Perform environment-specific steps
deploy_steps $branch $render $pat