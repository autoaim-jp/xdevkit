SHELL=/bin/bash
PHONY=default init-submodule

.PHONY: $(PHONY)

default: init-submodule

init-submodule:
	git submodule update --init --remote
	
