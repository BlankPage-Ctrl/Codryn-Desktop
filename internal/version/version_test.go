package version

import (
	"testing"
)

func TestNormalizeTag(t *testing.T) {
	cases := []struct {
		name  string
		raw   string
		want  string
		valid bool
	}{
		{name: "plain semver", raw: "1.2.3", want: "1.2.3", valid: true},
		{name: "leading v stripped", raw: "v1.2.3", want: "1.2.3", valid: true},
		{name: "leading V stripped", raw: "V1.2.3", want: "1.2.3", valid: true},
		{name: "prerelease kept", raw: "v1.2.3-beta.1", want: "1.2.3-beta.1", valid: true},
		{name: "build metadata kept", raw: "1.2.3+abc1234", want: "1.2.3+abc1234", valid: true},
		{name: "empty invalid", raw: "", want: "", valid: false},
		{name: "blank invalid", raw: "   ", want: "", valid: false},
		{name: "non semver invalid", raw: "main", want: "", valid: false},
		{name: "partial invalid", raw: "1.2", want: "", valid: false},
		{name: "double v invalid", raw: "vv1.2.3", want: "", valid: false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, ok := NormalizeTag(tc.raw)
			if ok != tc.valid || got != tc.want {
				t.Fatalf("NormalizeTag(%q) = (%q, %v), want (%q, %v)",
					tc.raw, got, ok, tc.want, tc.valid)
			}
		})
	}
}

func TestResolveVersion(t *testing.T) {
	cases := []struct {
		name         string
		tag          string
		buildVersion string
		sha          string
		want         string
	}{
		{name: "tag wins", tag: "1.2.3", buildVersion: "1.0.0", sha: "abc1234", want: "1.2.3"},
		{name: "build version fallback", tag: "", buildVersion: "1.0.0", sha: "abc1234", want: "1.0.0"},
		{name: "sha fallback", tag: "", buildVersion: "", sha: "abc1234", want: "0.0.0-dev+abc1234"},
		{name: "dev fallback", tag: "", buildVersion: "", sha: "", want: "0.0.0-dev"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := ResolveVersion(tc.tag, tc.buildVersion, tc.sha); got != tc.want {
				t.Fatalf("ResolveVersion() = %q, want %q", got, tc.want)
			}
		})
	}
}
