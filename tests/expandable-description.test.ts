import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { ExpandableDescription } from "@/components/expandable-description"

describe("property description before JavaScript or interaction", () => {
  it("includes the complete description and existing fee disclosure in the initial HTML", () => {
    const description = "Bedroom layout and access details.\n\nThe price includes a non-refundable 5% payment-processing fee.\n\nFinal paragraph of the complete description."
    const html = renderToStaticMarkup(createElement(ExpandableDescription, { summary: "A lakeside stay.", description }))

    expect(html).toContain(description)
    expect(html).toMatch(/<details[^>]*><summary[\s\S]+<\/summary>[\s\S]+Final paragraph/)
    expect(html).not.toMatch(/<details[^>]*\sopen(?:[\s=>])/)
  })

  it("renders description text safely without interpreting it as markup", () => {
    const html = renderToStaticMarkup(createElement(ExpandableDescription, { summary: "A lakeside stay.", description: 'Kitchen & dining. <script>alert("listing")</script>' }))

    expect(html).toContain("Kitchen &amp; dining.")
    expect(html).toContain("&lt;script&gt;")
    expect(html).not.toContain("<script>")
  })

  it.each(["", "   ", " A lakeside stay. "])("avoids an empty or duplicate disclosure for %j", (description) => {
    const html = renderToStaticMarkup(createElement(ExpandableDescription, { summary: "A lakeside stay.", description }))

    expect(html).toContain("A lakeside stay.")
    expect(html).not.toContain("<details")
    expect(html).not.toContain("Read More")
  })
})
