import GenericGrid from "lib/Components/ArtworkGrids/GenericGrid"
import React, { Component } from "react"
import createEnvironment from "lib/relay/createEnvironment"
import renderWithLoadProgress from "lib/utils/renderWithLoadProgress"
import { Button, Text, View } from "react-native"
import { RelayPaginationProp } from "react-relay"
import { SectionHeader } from "./SectionHeader"
import { createPaginationContainer, graphql, QueryRenderer, QueryRendererProps } from "react-relay"
import { get } from "lodash"

const PAGE_SIZE = 2

interface RelayProps {
  onLoad: ({ data: array }) => void
  relay: RelayPaginationProp
  sale_artworks: {
    connection: {
      pageInfo: {
        hasNextPage: boolean
      }
      edges: Array<{
        node: {
          artwork: {
            __id: string
            image: {
              aspect_ratio: number
            }
          }
        }
      }>
    }
  }
}

const Query = graphql.experimental`
  query LotsByFollowedArtistsQuery($count: Int!, $cursor: String) {
    viewer {
      ...LotsByFollowedArtists_viewer @arguments(count: $count, cursor: $cursor)
    }
  }
`

const Pagination = createPaginationContainer(
  GridContainer,
  graphql.experimental`
    fragment LotsByFollowedArtists_viewer on Viewer
      @argumentDefinitions(count: { type: "Int" }, cursor: { type: "String" }) {
      sale_artworks(first: $count, after: $cursor, include_artworks_by_followed_artists: false)
        @connection(key: "LotsByFollowedArtists_sale_artworks") {
        pageInfo {
          endCursor
          hasNextPage
        }
        edges {
          cursor
          node {
            artwork {
              ...GenericGrid_artworks
            }
          }
        }
      }
    }
  `,
  {
    getConnectionFromProps: ({ sale_artworks }) => sale_artworks && sale_artworks.connection,
    getFragmentVariables: (prevVars, totalCount) => ({ ...prevVars, count: totalCount }),
    getVariables: (props, { count, cursor }) => ({ count, cursor }),
    query: Query,
  }
)

export class LotsByFollowedArtists extends Component<any> {
  render() {
    return (
      <QueryRenderer
        environment={createEnvironment()}
        query={Query}
        variables={{
          count: PAGE_SIZE,
        }}
        render={renderWithLoadProgress(Pagination)}
      />
    )
  }
}

function GridContainer(props: RelayProps) {
  const artworks = get(props, "viewer.sale_artworks.edges", [])
    // .filter(({ node }) => node.isOpen)
    .map(({ node }) => node.artwork)

  if (!artworks.length) {
    return null
  }

  return (
    <View>
      <SectionHeader
        section={{
          title: "Lots by Artists You Follow",
        }}
      />
      <Button title="Load More" onPress={() => props.relay.loadMore(PAGE_SIZE, x => x)} />
      <GenericGrid artworks={artworks} />
    </View>
  )
}
