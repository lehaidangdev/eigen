import { Flex, Separator, Spacer, Theme } from "@artsy/palette"
import { PlaceholderImage, PlaceholderText } from "lib/utils/placeholders"
import React from "react"

export const HeaderTabsGridPlaceholder: React.FC = () => (
  <Theme>
    <Flex>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" px="2">
        <Flex>
          <Spacer mb={75} />
          {/* Entity name */}
          <PlaceholderText width={180} />
          <Spacer mb={1} />
          {/* subtitle text */}
          <PlaceholderText width={100} />
          {/* more subtitle text */}
          <PlaceholderText width={150} />
        </Flex>
        <PlaceholderText width={70} alignSelf="flex-end" />
      </Flex>
      <Spacer mb={3} />
      {/* tabs */}
      <Flex justifyContent="space-around" flexDirection="row" px={2}>
        <PlaceholderText width={40} />
        <PlaceholderText width={50} />
        <PlaceholderText width={40} />
      </Flex>
      <Spacer mb={1} />
      <Separator />
      <Spacer mb={3} />
      {/* masonry grid */}
      <Flex mx={2} flexDirection="row">
        <Flex mr={1} style={{ flex: 1 }}>
          <PlaceholderImage height={92} />
          <PlaceholderImage height={172} />
          <PlaceholderImage height={82} />
        </Flex>
        <Flex ml={1} style={{ flex: 1 }}>
          <PlaceholderImage height={182} />
          <PlaceholderImage height={132} />
          <PlaceholderImage height={86} />
        </Flex>
      </Flex>
    </Flex>
  </Theme>
)
