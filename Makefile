SHELL=/bin/bash
PHONY=default init-submodule commit

.PHONY: $(PHONY)

default: init-submodule

init-submodule:
	git submodule update --init --remote
	
commit:
	./app/commit.sh "$(COMMIT_MESSAGE)"

