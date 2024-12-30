
dev:
	@$(MAKE) -j2 css watch


# plugin
watch:
	bun build src/index.ts --outdir dist --watch


# style
css:
	sass --watch assets/css/global.scss:assets/css/global.css --style=compressed