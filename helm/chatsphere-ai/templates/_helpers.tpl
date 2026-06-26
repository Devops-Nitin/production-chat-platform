{{/*
Return chart name
*/}}
{{- define "chatsphere-ai.name" -}}
{{- .Chart.Name -}}
{{- end }}

{{/*
Return full release name
*/}}
{{- define "chatsphere-ai.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{/*
Common labels
*/}}
{{- define "chatsphere-ai.labels" -}}
app.kubernetes.io/name: {{ include "chatsphere-ai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "chatsphere-ai.selectorLabels" -}}
app.kubernetes.io/name: {{ include "chatsphere-ai.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
