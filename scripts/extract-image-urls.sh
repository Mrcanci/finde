#!/bin/bash
# Extrae las URLs reales de images.unsplash.com para los 30 slugs
# Versión compatible con Bash 3.2 (macOS default)

PAIRS=(
  "machu_picchu|4hMET7vYTAQ"
  "vinicunca|_yA8akNXRpg"
  "choquequirao|Cnoo4jhXDRg"
  "humantay|K_qlCr6yWtI"
  "valle_sagrado|BtPvU8UcdT4"
  "ollantaytambo|Uzf_UgO18LM"
  "pisac|iGHgf2US7-4"
  "tambomachay|dGmf_G7HKbs"
  "sacsayhuaman|O85d8y5Ub3Y"
  "maras|Yti_69tSeZ4"
  "qeros|G-ZdZQyoeWg"
  "manu|bth9eOeGljs"
  "ceviche|YmC1_EP6TJQ"
  "lima_colonial|-wyeD_wEwNY"
  "surf_costa_verde|hvFOVjfz8Pw"
  "caral|-AqK6xzrz1Q"
  "lomas|9bF1gfTFwo4"
  "pachacamac|NVzhfyaTQPY"
  "colca|cXKphV4gB4o"
  "salinas_aguada|g9mu-CGMbII"
  "yanahuara|Qx5fH1tngEw"
  "misti|hpc4DFyjY40"
  "sillar|EaFPpSlAeUA"
  "mancora|NuxM-do0cDM"
  "huanchaco|wd_bzAn3tAU"
  "chan_chan|h5sbws1UADE"
  "kuelap|_M3Cz2NRPCs"
  "tambopata|vP1sBGi9zZs"
  "iquitos|0h5USF5uizw"
  "ayahuasca|w8umjoVdgIc"
)

for pair in "${PAIRS[@]}"; do
  label="${pair%%|*}"
  slug="${pair#*|}"
  url=$(curl -sI "https://unsplash.com/photos/${slug}/download?force=true" | grep -i "^location:" | awk '{print $2}' | tr -d '\r')
  base_url=$(echo "$url" | cut -d'?' -f1)
  if [ -n "$base_url" ]; then
    echo "${label}|${base_url}?w=1200&q=80"
  else
    echo "${label}|ERROR_NO_REDIRECT"
  fi
done
