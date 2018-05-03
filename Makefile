# ---------------------------------------------------------------------------------
# BLOG APP
# ---------------------------------------------------------------------------------

# -- Options

_ENV=production

# -- Helpers

clean:
	@rm **/.DS_Store .DS_Store

install:
	@sudo gem install scss-lint bundler
	@npm install -g gulp@next babel-core babel-preset-es2015 babel-cli foundation-cli  foundation-sites
	# imagemin

build:
	@npm run gulp build

watch:
	@npm run gulp watch

dev: 
	@tmuxp load ./.tmuxp.yaml

server:
	@npm run gulp server

run:
	@npm run gulp

.PHONY: install clean build watch dev server run
.DEFAULT_GOAL := run
