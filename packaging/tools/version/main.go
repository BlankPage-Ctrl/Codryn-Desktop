// Command version prints the resolved Codryn desktop version for packaging.
//
// It reuses internal/version, so the .deb (nfpm), the Windows installer
// (Inno Setup), and the runtime version never drift apart:
// CODRYN_VERSION > APP_VERSION > ldflags > 0.0.0-dev[+sha].
// One leading "v"/"V" is stripped, so a GitHub Release tag (v1.2.3)
// can be passed through verbatim.
//
// Dev fallback: run with no env set and you get 0.0.0-dev (or
// 0.0.0-dev+<sha> under CI). Nothing to configure, wails.json stays
// at 0.0.0-dev.
//
// Usage from Codryn-Desktop/:
//
//	go run ./packaging/tools/version
//	CODRYN_VERSION=v1.2.3 go run ./packaging/tools/version # sh
//	$env:CODRYN_VERSION = 'v1.2.3'                         # PowerShell
//	go run ./packaging/tools/version --sync-wails-json
package main

import (
	"flag"
	"fmt"
	"os"
	"regexp"

	"codryn/desktop/internal/version"
)

// productVersionRe matches the "productVersion" line in wails.json.
// A targeted replacement keeps key order and formatting intact,
// unlike a full JSON remarshal.
var productVersionRe = regexp.MustCompile(`(?m)^(\s*"productVersion"\s*:\s*")([^"]*)(")`)

func main() {
	syncWails := flag.Bool("sync-wails-json", false, "write the resolved version into wails.json info.productVersion")
	flag.Parse()

	v := version.GetVersion()

	if *syncWails {
		if err := syncWailsJSON(v); err != nil {
			fmt.Fprintln(os.Stderr, "version: "+err.Error())
			os.Exit(1)
		}
		return
	}

	fmt.Println(v)
}

// syncWailsJSON sets info.productVersion in wails.json to v.
// The file is left untouched when it already matches, so dev trees
// (already 0.0.0-dev) stay clean.
func syncWailsJSON(v string) error {
	const path = "wails.json"
	raw, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s (run from Codryn-Desktop/): %w", path, err)
	}
	m := productVersionRe.FindStringSubmatch(string(raw))
	if m == nil {
		return fmt.Errorf("%s has no productVersion line", path)
	}
	if m[2] == v {
		fmt.Println(v)
		return nil
	}
	patched := productVersionRe.ReplaceAll(raw, []byte(`${1}`+v+`${3}`))
	if err := os.WriteFile(path, patched, 0o644); err != nil {
		return fmt.Errorf("write %s: %w", path, err)
	}
	fmt.Println(v)
	return nil
}
