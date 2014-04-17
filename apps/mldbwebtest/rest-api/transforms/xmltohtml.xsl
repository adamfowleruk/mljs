<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<!-- Root node -->
<xsl:template match="/">
  <html><head><title>View</title>
    <link rel="stylesheet" type="text/css" href="/css/xmltohtml.css" />
  </head><body>
    <div class="element">
        <!--
        &lt;<span class="name"><xsl:value-of select="name()"/></span><xsl:apply-templates select="@*"/>
        -->
        <!-- Grab all namespaces and declare them.  distinct-values() is XPath 2.0, however. -->
        <!--
        <xsl:for-each select="distinct-values(//namespace::*)">
            xmlns:<xsl:value-of select="name()" />="<xsl:value-of select="." />"
        </xsl:for-each>
        &gt;
        -->
        <xsl:apply-templates select="node()"/>
        <!--
        &lt;/<span class="name"><xsl:value-of select="name()"/></span>&gt;
        -->
    </div>
  </body>
</html>
</xsl:template>

    <!-- Evaluate Attributes -->
    <xsl:template match="@*">
        <span class="attribute">
            <span class="name">
                <xsl:value-of select="name()"/>
            </span>="<span class="value"><xsl:value-of select="." /></span>"
        </span>
    </xsl:template>


    <!-- Evaluate Elements -->
    <xsl:template match="*" priority="10">
        <div class="element">
            <!-- First, create the opening tag with the attributes -->
            &lt;<span class="name"><xsl:value-of select="name()"/></span><xsl:apply-templates select="@*"/>&gt;
            <!-- Then, add children -->
            <xsl:apply-templates select="node()"/>
            <!-- Finally, add the closing tag -->
            &lt;/<span class="name"><xsl:value-of select="name()"/></span>&gt;
        </div>
    </xsl:template>


    <!-- Just copy everything else (text, comments, etc.) -->
    <xsl:template match="node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>