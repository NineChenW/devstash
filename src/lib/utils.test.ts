import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("joins simple class strings", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("ignores falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b")
  })

  it("merges conflicting tailwind utilities, last one wins", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-sm text-red-500", "text-blue-500")).toBe("text-sm text-blue-500")
  })

  it("supports conditional object syntax via clsx", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active")
  })

  it("supports nested arrays", () => {
    expect(cn(["a", ["b", ["c"]]])).toBe("a b c")
  })
})
