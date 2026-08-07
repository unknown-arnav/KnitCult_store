#!/usr/bin/env bash
# Bootstrap script for MariaDB + Redis on Emergent pod
# Run this if the pod was restarted and mariadb/redis are missing.
# Data lives in /app/data (persisted). Packages may need reinstall.
set -e

# 1. Ensure packages
if ! command -v mariadbd >/dev/null 2>&1; then
  echo "[bootstrap] Installing mariadb-server + redis-server..."
  DEBIAN_FRONTEND=noninteractive apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq mariadb-server redis-server
fi

# 2. Ensure runtime dirs
mkdir -p /var/run/mysqld /app/data/mysql /app/data/redis
chown -R mysql:mysql /var/run/mysqld /app/data/mysql

# 3. If MySQL datadir empty, initialize it
if [ ! -d "/app/data/mysql/mysql" ]; then
  echo "[bootstrap] Initializing MariaDB datadir at /app/data/mysql..."
  mariadb-install-db --user=mysql --datadir=/app/data/mysql >/dev/null
fi

# 4. Ensure supervisor knows about the services
cp /app/scripts/mariadb.supervisor.conf /etc/supervisor/conf.d/mariadb.conf 2>/dev/null || true
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start mariadb redis 2>/dev/null || true

sleep 3
sudo supervisorctl status mariadb redis
redis-cli ping
mysql -u root -e "SELECT VERSION();"
echo "[bootstrap] Done."
