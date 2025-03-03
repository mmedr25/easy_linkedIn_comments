
dev:
	@$(MAKE) -j2 css watch


ts:
	bun build src/**/*.ts --outdir dist --watch


# plugin
watch:
	web-ext run


# style
css:
	sass --watch assets/css:assets/css --style=compressed
