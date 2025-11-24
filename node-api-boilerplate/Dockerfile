FROM node:16-alpine AS development


WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

# Copia arquivos de configuração e dependências
COPY tsconfig*.json ./
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código-fonte
COPY src/ src/

# Define a propriedade do diretório node_modules para o usuário 'node'
RUN chown -R node /app/node_modules

# Troca para o usuário não-root por segurança
USER node

# EXPOSE 8080 (Esta linha é um comentário no seu arquivo original)