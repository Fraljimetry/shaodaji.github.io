# Shaoda Ji — Personal Mathematics Homepage

This is a complete static website. It uses only HTML, CSS, and a small JavaScript file, so no build system is required.

## Preview it on your computer

From inside this folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Do not judge the site by double-clicking `index.html`; using the small local server above gives a more accurate preview.

## Put it online with GitHub Pages

GitHub Pages is the simplest free option for this site.

### 1. Create the repository

1. Sign in to GitHub.
2. Create a new repository.
3. Name it exactly:

```text
YOUR-GITHUB-USERNAME.github.io
```

For example, if your username is `mathstudent`, use `mathstudent.github.io`.

4. Make the repository public if you are using GitHub Free.
5. Create the repository.

### 2. Upload the website

Open the repository and choose **Add file → Upload files**.

Upload the **contents** of this homepage folder, including:

```text
index.html
research.html
teaching.html
notes.html
cv.html
404.html
.nojekyll
assets/
files/
robots.txt
```

The files must be at the repository root. Do not upload one enclosing folder containing all of them.

Commit the upload to the `main` branch.

### 3. Enable GitHub Pages

1. Open the repository's **Settings**.
2. In the left sidebar, select **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select branch `main`.
5. Select folder `/ (root)`.
6. Click **Save**.

After GitHub finishes deployment, the site will be available at:

```text
https://YOUR-GITHUB-USERNAME.github.io/
```

The first deployment may take several minutes. The deployment status is visible in the repository's **Actions** tab and on the **Settings → Pages** screen.

## Updating the website later

Replace the changed files in the same GitHub repository and commit them to `main`. GitHub Pages will publish the new version automatically.

Common edits:

- Main text: `index.html`
- Research: `research.html`
- Teaching: `teaching.html`
- Notes: `notes.html`
- CV page: `cv.html`
- Visual design and alignment: `assets/css/style.css`
- Profile image: `assets/img/shaoda-ji.webp`
- CV PDF: `files/Shaoda_Ji_CV.pdf`

Keep the same filenames when replacing the photograph or CV, and the existing links will continue to work.

## Current custom domain

This package already includes a root-level `CNAME` file for `shaodaji.cc`. Keep that file in the repository root so GitHub Pages continues to serve the site at `https://shaodaji.cc`. The Cloudflare DNS records and GitHub Pages custom-domain setting must remain configured for the same domain.

Official documentation:

- https://docs.github.com/pages/quickstart
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
