#!/bin/sh

if [ -d "database" ]; then
	if [ "$(ls -A database)" ] ; then
		echo "Database already setup"
		exit
	fi
else
	mkdir database
fi
echo "==== Launching database ====\n"
mongod --quiet --port 29123 --dbpath=./database --logpath log --logappend &
read -p "Enter password for admin" name
echo "==== Executing admin commands ====\n"
mongo --port 29123 --eval "db=db.getSiblingDB(\"admin\"); db.createUser({\"user\":\"admin\", \"pwd\":\"$name\", roles:[\"readWriteAnyDatabase\", \"dbAdminAnyDatabase\", \"userAdminAnyDatabase\", \"hostManager\"]});db.shutdownServer();"
sleep 3
echo '==== Restarting Database ====\n'
mongod --quiet --auth --port 29123 --dbpath=./database --logpath log --logappend &
sleep 3
echo "==== Login in Database and executing commands ====\n"
mongo --port 29123 -u "admin" -p "$name" --authenticationDatabase="admin" --eval 'db=db.getSiblingDB("chess"); db.createUser({"user" : "manager", "pwd": "azerty", "roles":["readWrite"]}) ;db.createCollection("Users"); db.createCollection("Games");db=db.getSiblingDB("admin");db.shutdownServer();'
echo "==== Setup finished ===="
