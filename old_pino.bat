@ECHO OFF
SETLOCAL
SET PINO_LOG_LEVEL=warn
call nvm use 12.3.1
call yarn add pino@6.10.0
call node src\simple-test.js 
