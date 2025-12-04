# Genome Dashboard

This is a React application to analyze family genome data.

## Features

- **Data Parsing**: customized for your `atpl.txt` format (rsID, Chrom, Pos, Father, Son1, Son2, Mother).
- **Mendelian Consistency**: Checks if children alleles match parents.
- **Mitochondrial Analysis**: Verifies maternal lineage.
- **Sibling Sharing**: Calculates genetic similarity between siblings.
- **Trait Lookup**: Checks for specific health and trait variants (Alzheimer's, Longevity, etc.).

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## Data

You can upload your `.txt` file directly in the UI.
A demo file (your provided data) is included and can be loaded by clicking "Load Demo Data".
