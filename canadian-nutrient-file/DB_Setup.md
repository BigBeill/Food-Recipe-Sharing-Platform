# Setting up the PostgreSQL database

1. download Postgresql

2. using createdb CLI create the database

```
createdb "Canadian Nutrient File"
```

3. Create a new user

```
createuser myuser --createdb --login --pwprompt
```

4. (optional) Connect to new database to test successful creation

```
psql "Canadian Nutrient File"
```

5. import the database backup from provided SQL file

```
psql -U myuser -d "Canadian Nutrient File" -f Nutrient_DB_Backup.sql
```

6. Test that DB was populated successfully

```
psql -U myuser -d "Canadian Nutrient File" <<EOF
\dt
SELECT COUNT(*) FROM nutrients;
SELECT * FROM nutrients LIMIT 5;
EOF
```
