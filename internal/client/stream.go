package client

import (
	"bufio"
	"io"
	"net/http"
	"strings"
)

type StreamReader interface {
	ReadEvent() ([]byte, error)
	Close() error
}

// httpStreamReader parses the `data: <json>` frames of an HTTP SSE response.
type httpStreamReader struct {
	resp *http.Response
	sc   *bufio.Scanner
	buf  []byte
	done bool
	err  error
}

func newHTTPStreamReader(resp *http.Response) *httpStreamReader {
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
	return &httpStreamReader{resp: resp, sc: sc}
}

func (r *httpStreamReader) ReadEvent() ([]byte, error) {
	if r.done {
		return nil, r.err
	}
	for r.sc.Scan() {
		line := strings.TrimSpace(r.sc.Text())
		if line == "" {
			if len(r.buf) > 0 {
				event := r.buf
				r.buf = nil
				return event, nil
			}
			continue
		}
		data, ok := strings.CutPrefix(line, "data:")
		if !ok {
			continue
		}
		if r.buf != nil {
			r.buf = append(r.buf, '\n')
		}
		r.buf = append(r.buf, strings.TrimSpace(data)...)
	}
	if len(r.buf) > 0 {
		event := r.buf
		r.buf = nil
		return event, nil
	}
	r.done = true
	if err := r.sc.Err(); err != nil {
		r.err = err
		return nil, err
	}
	r.err = io.EOF
	return nil, io.EOF
}

func (r *httpStreamReader) Close() error {
	return r.resp.Body.Close()
}
