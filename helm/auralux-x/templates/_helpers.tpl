{{/*
Expand the name of the chart.
*/}}
{{- define "auralux.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "auralux.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "auralux.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: auralux-x
{{- end }}

{{/*
Selector labels for a specific service
*/}}
{{- define "auralux.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .release }}
{{- end }}

{{/*
Service template: Deployment + Service + optional HPA
*/}}
{{- define "auralux.microservice" -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .svc.name }}
  namespace: {{ .global.namespace }}
  labels:
    app: {{ .svc.name }}
    {{- include "auralux.labels" .ctx | nindent 4 }}
spec:
  replicas: {{ .svc.replicas | default 2 }}
  selector:
    matchLabels:
      app: {{ .svc.name }}
  template:
    metadata:
      labels:
        app: {{ .svc.name }}
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: {{ .svc.name }}
          image: "{{ .svc.image.repository }}:{{ .svc.image.tag }}"
          ports:
            - containerPort: {{ .svc.port }}
              name: http
          envFrom:
            - configMapRef:
                name: auralux-config
            - secretRef:
                name: auralux-secrets
          env:
            - name: PORT
              value: "{{ .svc.port }}"
            {{- if .svc.mongoDatabase }}
            - name: MONGO_URI
              value: "mongodb://mongodb-0.mongodb-headless.{{ .global.namespace }}.svc.cluster.local:27017/{{ .svc.mongoDatabase }}"
            {{- end }}
          resources:
            {{- toYaml .svc.resources | nindent 12 }}
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .svc.name }}
  namespace: {{ .global.namespace }}
spec:
  type: ClusterIP
  selector:
    app: {{ .svc.name }}
  ports:
    - port: {{ .svc.port }}
      targetPort: http
      name: http
{{- if and .svc.hpa .svc.hpa.enabled }}
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .svc.name }}-hpa
  namespace: {{ .global.namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .svc.name }}
  minReplicas: {{ .svc.hpa.minReplicas }}
  maxReplicas: {{ .svc.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .svc.hpa.targetCPU }}
{{- end }}
{{- end }}
