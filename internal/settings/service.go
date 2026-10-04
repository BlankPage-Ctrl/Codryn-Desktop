package settings

import "codryn/desktop/internal/client"

type DefaultProvider struct {
	ProviderID *string `json:"providerId"`
	ModelID    *string `json:"modelId"`
}

type SettingValue struct {
	Key   string  `json:"key"`
	Value *string `json:"value"`
}

// DefaultProvider is typed - the frontend only fills params, no query/JSON parsing needed.
// Appearance & Theme live in LOCAL STORAGE, not the DB (only Default Provider/Model stays in the DB).

type Service struct {
	c *client.Client
}

func NewService(c *client.Client) *Service {
	return &Service{c: c}
}

// Raw KV - kept as a generic fallback, but the frontend should ideally use the typed helpers below.

func (s *Service) GetValue(key string) (SettingValue, error) {
	return client.DoOK[SettingValue](s.c, "GET", "/settings/"+key, nil, nil)
}

func (s *Service) SetValue(key, value string) (SettingValue, error) {
	body := map[string]string{"value": value}
	return client.DoOK[SettingValue](s.c, "PUT", "/settings/"+key, body, nil)
}

func (s *Service) GetDefaultProvider() (DefaultProvider, error) {
	pidVal, err := s.GetValue("defaultProviderId")
	if err != nil {
		return DefaultProvider{}, err
	}
	midVal, err := s.GetValue("defaultModelId")
	if err != nil {
		return DefaultProvider{}, err
	}
	var pid, mid *string
	if pidVal.Value != nil && *pidVal.Value != "" {
		pid = pidVal.Value
	}
	if midVal.Value != nil && *midVal.Value != "" {
		mid = midVal.Value
	}
	return DefaultProvider{ProviderID: pid, ModelID: mid}, nil
}

func (s *Service) SetDefaultProvider(providerID, modelID string) (DefaultProvider, error) {
	if _, err := s.SetValue("defaultProviderId", providerID); err != nil {
		return DefaultProvider{}, err
	}
	if _, err := s.SetValue("defaultModelId", modelID); err != nil {
		return DefaultProvider{}, err
	}
	pid := providerID
	mid := modelID
	return DefaultProvider{ProviderID: &pid, ModelID: &mid}, nil
}
