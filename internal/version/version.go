// Package version is the single source of truth for the desktop version.
//
// Resolution order (highest priority first):
//  1. CODRYN_VERSION env, set by CI from the GitHub Release tag
//     (GITHUB_REF_NAME, e.g. "v1.2.3"). One leading "v" is stripped.
//  2. APP_VERSION env, generic alternative for custom deployments.
//  3. Version var, injected at build time via ldflags:
//     go build -ldflags "-X codryn/desktop/internal/version.Version=1.2.3"
//  4. Dev fallback "0.0.0-dev" with the short commit sha when available
//     (GITHUB_SHA / GIT_SHA), e.g. "0.0.0-dev+abc1234".
//
// This mirrors packages/backend/apps/shared/version.ts. The desktop binary
// is distributed without a .git directory, so the version is resolved from
// the environment and build-time flags, never via git describe at runtime.
package version

import (
	"os"
	"regexp"
	"strings"
)

// AppName is the product name reported alongside the version.
const AppName = "codryn"

// DevVersion is the fallback version for local builds without a tag.
const DevVersion = "0.0.0-dev"

// Version holds the build-time version injected via ldflags.
// Keep empty in source; CI fills it from the GitHub Release tag.
var Version = ""

var semverPattern = regexp.MustCompile(`^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$`)

// VersionInfo is the payload exposed to the frontend via Wails binding.
// JSON tags are required so the generated TypeScript sees the fields.
type VersionInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Sha     string `json:"sha,omitempty"`
	Tag     string `json:"tag,omitempty"`
}

// NormalizeTag converts a raw version or release tag into a semver string.
// It strips one leading "v"/"V" (GitHub Release tags look like "v1.2.3").
// The second return value reports whether the input was usable semver.
func NormalizeTag(raw string) (string, bool) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", false
	}
	stripped := trimmed
	if strings.HasPrefix(stripped, "v") || strings.HasPrefix(stripped, "V") {
		stripped = stripped[1:]
	}
	if !semverPattern.MatchString(stripped) {
		return "", false
	}
	return stripped, true
}

func resolveSha() string {
	for _, key := range []string{"GITHUB_SHA", "GIT_SHA"} {
		sha := strings.TrimSpace(os.Getenv(key))
		if sha == "" {
			continue
		}
		if len(sha) > 7 {
			sha = sha[:7]
		}
		return sha
	}
	return ""
}

// ResolveVersion is the pure version picker, separated from env access so
// the priority chain is unit-testable. Empty strings mean absent.
func ResolveVersion(tag, buildVersion, sha string) string {
	if tag != "" {
		return tag
	}
	if buildVersion != "" {
		return buildVersion
	}
	if sha != "" {
		return DevVersion + "+" + sha
	}
	return DevVersion
}

// GetVersion resolves the current version from env and build flags.
func GetVersion() string {
	var tag string
	if v, ok := NormalizeTag(os.Getenv("CODRYN_VERSION")); ok {
		tag = v
	} else if v, ok := NormalizeTag(os.Getenv("APP_VERSION")); ok {
		tag = v
	}
	buildVersion, _ := NormalizeTag(Version)
	return ResolveVersion(tag, buildVersion, resolveSha())
}

// GetVersionInfo resolves the full version payload for display and logs.
func GetVersionInfo() VersionInfo {
	rawTag := os.Getenv("CODRYN_VERSION")
	if strings.TrimSpace(rawTag) == "" {
		rawTag = os.Getenv("APP_VERSION")
	}
	info := VersionInfo{
		Name:    AppName,
		Version: GetVersion(),
		Sha:     resolveSha(),
	}
	if strings.TrimSpace(rawTag) != "" {
		info.Tag = strings.TrimSpace(rawTag)
	}
	return info
}
