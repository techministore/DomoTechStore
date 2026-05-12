<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>XML Sitemap - DomoTechStore</title>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<style type="text/css">
					body {
						font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
						color: #333;
						background-color: #f8f9fa;
						margin: 0;
						padding: 40px;
					}
					.container {
						max-width: 1000px;
						margin: 0 auto;
						background: #fff;
						padding: 40px;
						border-radius: 12px;
						box-shadow: 0 4px 12px rgba(0,0,0,0.05);
					}
					h1 { color: #2d3436; font-size: 24px; margin-bottom: 10px; }
					p { color: #636e72; margin-bottom: 30px; font-size: 14px; }
					table { width: 100%; border-collapse: collapse; margin-top: 20px; }
					th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #2d3436; font-size: 14px; }
					td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; word-break: break-all; }
					tr:hover { background-color: #fcfcfc; }
					a { color: #0984e3; text-decoration: none; }
					a:hover { text-decoration: underline; }
					.priority-high { color: #00b894; font-weight: bold; }
				</style>
			</head>
			<body>
				<div class="container">
					<h1>Sitemap de DomoTechStore</h1>
					<p>Este es el archivo XML Sitemap, destinado a ser leído por buscadores como Google. <br/>
					Contiene las URLs de las mejores ofertas y comparativas de domótica barata 2026.</p>
					<table>
						<thead>
							<tr>
								<th>URL del sitio</th>
								<th>Prioridad</th>
								<th>Última Modificación</th>
							</tr>
						</thead>
						<tbody>
							<xsl:for-each select="sitemap:urlset/sitemap:url">
								<tr>
									<td>
										<a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
									</td>
									<td>
										<span class="{if (number(sitemap:priority) >= 0.8) then 'priority-high' else ''}">
											<xsl:value-of select="sitemap:priority"/>
										</span>
									</td>
									<td>
										<xsl:value-of select="sitemap:lastmod"/>
									</td>
								</tr>
							</xsl:for-each>
						</tbody>
					</table>
				</div>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
