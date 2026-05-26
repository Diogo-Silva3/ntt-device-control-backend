#!/bin/bash

# Configurar PostgreSQL para escutar em todas as interfaces
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/*/main/postgresql.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar
sudo netstat -tlnp | grep 5432
