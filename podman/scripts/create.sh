#!/usr/bin/env bash

source ./podman/scripts/functions.sh
mkdir -p ./podman/volumes/postgres

{ cat ./podman/local-dev/configmap-local-dev.yaml; echo "---"; sed "s|\${HOSTPATH}|$HOSTPATH|g" ./podman/local-dev/pod-postgres.yaml; } | podman play kube --replace -

echo "${CY}#############################################################################################"
echo "#                                                                                           #"
echo "#   postgres at ${GR}localhost:5434${CY} db:${GR}imp_doodle_jump${CY} user:${GR}postgres${CY} pass:${GR}postgres${CY}               #"
echo "#                                                                                           #"
echo "#############################################################################################${NC}"
