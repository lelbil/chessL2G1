#!/bin/bash
mongod --quiet --auth --port 29123 --smallfiles --dbpath=./database --logpath log --logappend &
