package files

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResolveWithinRejectsTraversal(t *testing.T) {
	root := t.TempDir()
	if err := os.Mkdir(filepath.Join(root, "ok"), 0755); err != nil {
		t.Fatal(err)
	}
	if _, err := ResolveWithin(root, "../outside"); err == nil {
		t.Fatal("expected traversal to be rejected")
	}
	got, err := ResolveWithin(root, "ok")
	if err != nil {
		t.Fatal(err)
	}
	if filepath.Base(got) != "ok" {
		t.Fatalf("got %s", got)
	}
}

func TestIsNameInvalid(t *testing.T) {
	if !IsNameInvalid("a/b") || !IsNameInvalid("") || IsNameInvalid("ok-file.txt") {
		t.Fatal("name validation mismatch")
	}
}

func TestSearchRegexWildcard(t *testing.T) {
	re, err := SearchRegex("foo*.txt")
	if err != nil {
		t.Fatal(err)
	}
	if !re.MatchString("foo-bar.txt") {
		t.Fatal("expected match")
	}
}
