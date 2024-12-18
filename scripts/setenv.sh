#!/bin/bash
export $(cat .env | xargs)
printenv | sort
