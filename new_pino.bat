@ECHO OFF
SETLOCAL
SET PINO_LOG_LEVEL=warn
call nvm use 20.2.0
call yarn add pino@latest
call node src\simple-test.js 
