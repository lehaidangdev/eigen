import { ActionType, ContextModule, OwnerType, TappedShowGroup } from "@artsy/cohesion"
import { Flex, Spacer, Text } from "@artsy/palette-mobile"
import { ShowsRailQuery } from "__generated__/ShowsRailQuery.graphql"
import { ShowsRail_showsConnection$key } from "__generated__/ShowsRail_showsConnection.graphql"
import { SectionTitle } from "app/Components/SectionTitle"
import { ShowCardContainer } from "app/Components/ShowCard"
import { extractNodes } from "app/utils/extractNodes"
import { useDevToggle } from "app/utils/hooks/useDevToggle"
import { Location, useLocationOrIpAddress } from "app/utils/hooks/useLocationOrIpAddress"
import { PlaceholderBox, RandomWidthPlaceholderText } from "app/utils/placeholders"
import { times } from "lodash"
import { Suspense } from "react"
import { FlatList } from "react-native"
import { graphql, useFragment, useLazyLoadQuery } from "react-relay"
import { useTracking } from "react-tracking"

interface ShowsRailProps {
  location?: Location | null
  ipAddress?: string | null
  title: string
}

// Because we never show more than 2 shows per gallery we need to overfetch, filter out, and then limit the number of shows.
const NUMBER_OF_SHOWS = 10

export const ShowsRail: React.FC<ShowsRailProps> = ({ location, ipAddress, title }) => {
  const tracking = useTracking()

  const queryVariables = location ? { near: location } : { ip: ipAddress }

  const queryData = useLazyLoadQuery<ShowsRailQuery>(ShowsQuery, queryVariables)

  const showsConnection = useFragment<ShowsRail_showsConnection$key>(
    showsFragment,
    queryData?.me?.showsConnection!
  )

  const shows = extractNodes(showsConnection)

  const hasShows = shows?.length

  if (!hasShows) {
    return null
  }

  return (
    <Flex>
      <Flex mx={2}>
        <SectionTitle title={title} />
      </Flex>
      <Flex>
        <FlatList
          horizontal
          initialNumToRender={2}
          showsHorizontalScrollIndicator={false}
          ListHeaderComponent={() => <Spacer x={2} />}
          ListFooterComponent={() => <Spacer x={2} />}
          ItemSeparatorComponent={() => <Spacer x={2} />}
          data={shows.slice(0, NUMBER_OF_SHOWS)}
          keyExtractor={(item) => `${item.internalID}`}
          renderItem={({ item, index }) => (
            <ShowCardContainer
              show={item}
              onPress={() => {
                tracking.trackEvent(tracks.tappedThumbnail(item.internalID, item.slug || "", index))
              }}
            />
          )}
        />
      </Flex>
    </Flex>
  )
}

const ShowsQuery = graphql`
  query ShowsRailQuery($near: Near, $ip: String) {
    me {
      showsConnection(first: 20, near: $near, ip: $ip, status: RUNNING_AND_UPCOMING)
        @optionalField {
        ...ShowsRail_showsConnection
      }
    }
  }
`

const showsFragment = graphql`
  fragment ShowsRail_showsConnection on ShowConnection {
    edges {
      node {
        internalID
        slug
        ...ShowCard_show
      }
    }
  }
`

export const tracks = {
  tappedThumbnail: (showID?: string, showSlug?: string, index?: number): TappedShowGroup => ({
    action: ActionType.tappedShowGroup,
    context_module: ContextModule.showsRail,
    context_screen_owner_type: OwnerType.home,
    destination_screen_owner_type: OwnerType.show,
    destination_screen_owner_id: showID,
    destination_screen_owner_slug: showSlug,
    horizontal_slide_position: index,
    type: "thumbnail",
  }),
}

interface ShowsRailContainerProps {
  title: string
  disableLocation?: boolean
}

export const ShowsRailContainer: React.FC<ShowsRailContainerProps> = ({
  disableLocation = false,
  ...restProps
}) => {
  const visualizeLocation = useDevToggle("DTLocationDetectionVisialiser")

  const { location, ipAddress, isLoading } = useLocationOrIpAddress(disableLocation)

  if (isLoading) {
    return <ShowsRailPlaceholder />
  }

  return (
    <Suspense fallback={<ShowsRailPlaceholder />}>
      {!!visualizeLocation && (
        <Text mx={2} color="red">
          Location: {JSON.stringify(location)}, IP: {JSON.stringify(ipAddress)}
        </Text>
      )}

      <ShowsRail {...restProps} location={location} ipAddress={ipAddress} />
    </Suspense>
  )
}

const ShowsRailPlaceholder: React.FC = () => {
  return (
    <Flex ml={2} mt={2}>
      <RandomWidthPlaceholderText minWidth={100} maxWidth={200} marginBottom={20} />

      <Flex flexDirection="row">
        {times(4).map((i) => (
          <PlaceholderBox key={i} width={280} height={370} marginRight={15} />
        ))}
      </Flex>
    </Flex>
  )
}
