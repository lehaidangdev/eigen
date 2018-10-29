import React from "react"
import "react-native"
import * as renderer from "react-test-renderer"
import { Location } from "../index"

it("looks correct when rendered", () => {
  const comp = renderer.create(<Location location={{}} />)
  expect(comp).toMatchSnapshot()
})
