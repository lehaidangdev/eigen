import { ActionType } from "@artsy/cohesion"
import { CssTransition, Spacer } from "@artsy/palette-mobile"
import { InboxQuery } from "__generated__/InboxQuery.graphql"
import { Inbox_me$data } from "__generated__/Inbox_me.graphql"
import { ConversationsContainer } from "app/Scenes/Inbox/Components/Conversations/Conversations"
import { MyBidsContainer } from "app/Scenes/MyBids/MyBids"
import { listenToNativeEvents } from "app/store/NativeModel"
import { defaultEnvironment } from "app/system/relay/createEnvironment"
import { PlaceholderBox, PlaceholderText } from "app/utils/placeholders"
import { renderWithPlaceholder } from "app/utils/renderWithPlaceholder"
import { track } from "app/utils/track"
import { ActionNames, ActionTypes } from "app/utils/track/schema"
import { Flex, Separator, Text } from "palette"
import React from "react"
import { EmitterSubscription, View, ViewProps } from "react-native"
// @ts-expect-error @types file generates duplicate declaration problems
import ScrollableTabView, { TabBarProps } from "react-native-scrollable-tab-view"
import { createRefetchContainer, graphql, QueryRenderer, RelayRefetchProp } from "react-relay"

const BIDS_TAB_INDEX = 0
const INQUIRIES_TAB_INDEX = 1
// Tabs
interface TabWrapperProps extends ViewProps {
  tabLabel: string
  _tests_isActiveTab: boolean
}

const TabWrapper = (props: TabWrapperProps) => <View {...props} />

export const InboxTabs = (props: TabBarProps) => (
  <>
    <Flex flexDirection="row" px="2" mb={2}>
      {props.tabs?.map((name: JSX.Element, page: number) => {
        const isTabActive = props.activeTab === page
        return (
          <CssTransition
            style={[{ opacity: isTabActive ? 1 : 0.3 }]}
            animate={["opacity"]}
            duration={200}
            key={`inbox-tab-${name}`}
          >
            <Text
              mr={2}
              color="black100"
              variant="lg-display"
              onPress={() => {
                if (!__TEST__) {
                  props.goToPage?.(page)
                }
              }}
            >
              {name}
            </Text>
          </CssTransition>
        )
      })}
    </Flex>
    <Separator />
  </>
)

enum Tab {
  bids = "bids",
  inquiries = "inquiries",
}
// Inbox
interface State {
  fetchingData: boolean
  activeTab: Tab
}

interface Props {
  me: Inbox_me$data
  relay: RelayRefetchProp
  isVisible: boolean
}

@track()
export class Inbox extends React.Component<Props, State> {
  // @ts-ignore STRICTNESS_MIGRATION
  conversations: ConversationsRef

  // @ts-ignore STRICTNESS_MIGRATION
  myBids: MyBidsRef

  state = {
    fetchingData: false,
    activeTab: Tab.bids,
  }

  listener: EmitterSubscription | null = null

  flatListHeight = 0

  componentDidMount() {
    this.listener = listenToNativeEvents((event) => {
      if (event.type === "NOTIFICATION_RECEIVED") {
        // TODO: Figure out this one, maybe in the individual components
        // or maybe set a 'force refetch' state, pass into the isActiveTab prop (with a better name), and then unset it
        // this.fetchData()
      }
    })
  }

  componentWillUnmount() {
    this.listener?.remove?.()
  }

  @track((_props, _state, args) => {
    const index = args[0]
    const tabs = ["inboxBids", "inboxInquiries"]

    return {
      action: ActionType.tappedNavigationTab,
      context_module: tabs[index],
      context_screen_owner_type: tabs[index],
      action_type: ActionTypes.Tap,
      action_name: ActionNames.InboxTab,
    }
  })
  handleNavigationTab(tabIndex: number) {
    const newTab: Tab = tabIndex === 0 ? Tab.bids : Tab.inquiries
    this.setState({ activeTab: newTab })
  }
  render() {
    const hasActiveBids = (this.props.me.myBids?.active ?? []).length > 0
    const initialPageNumber = hasActiveBids ? BIDS_TAB_INDEX : INQUIRIES_TAB_INDEX

    return (
      <ScrollableTabView
        style={{ paddingTop: 30 }}
        initialPage={initialPageNumber}
        renderTabBar={() => <InboxTabs />}
        onChangeTab={({ i }: { i: number }) => this.handleNavigationTab(i)}
      >
        <TabWrapper
          tabLabel="Bids"
          key="bids"
          style={{ flexGrow: 1, justifyContent: "center" }}
          // this is for testing purposes
          _tests_isActiveTab={initialPageNumber === BIDS_TAB_INDEX}
          testID="tabWrapper-bids"
        >
          <MyBidsContainer
            isActiveTab={this.props.isVisible && this.state.activeTab === Tab.bids}
            me={this.props.me}
          />
        </TabWrapper>
        <TabWrapper
          tabLabel="Inquiries"
          key="inquiries"
          style={{ flex: 1, justifyContent: "flex-start" }}
          // this is fr testing purposes
          _tests_isActiveTab={initialPageNumber === INQUIRIES_TAB_INDEX}
          testID="tabWrapper-inquiries"
        >
          <ConversationsContainer
            me={this.props.me}
            isActiveTab={this.props.isVisible && this.state.activeTab === Tab.inquiries}
          />
        </TabWrapper>
      </ScrollableTabView>
    )
  }
}

export const InboxContainer = createRefetchContainer(
  Inbox,
  {
    me: graphql`
      fragment Inbox_me on Me {
        ...Conversations_me
        ...MyBids_me
        myBids {
          active {
            sale {
              internalID
            }
            saleArtworks {
              internalID
            }
          }
        }
      }
    `,
  },
  graphql`
    query InboxRefetchQuery {
      me {
        ...Inbox_me
      }
    }
  `
)

export const InboxScreenQuery = graphql`
  query InboxQuery {
    me {
      ...Inbox_me
    }
  }
`

export const InboxQueryRenderer: React.FC<{ isVisible: boolean }> = (props) => {
  return (
    <QueryRenderer<InboxQuery>
      environment={defaultEnvironment}
      query={InboxScreenQuery}
      variables={{}}
      render={(...args) =>
        renderWithPlaceholder({
          Container: InboxContainer,
          initialProps: props,
          renderPlaceholder: () => <InboxPlaceholder />,
        })(...args)
      }
    />
  )
}

export const InboxPlaceholder = () => {
  return (
    <Flex height="100%" testID="inbox-placeholder">
      <Flex flexDirection="row" mx={2} mt={3} mb={1}>
        <PlaceholderText width={60} height={26} />
        <Spacer x={1} />
        <PlaceholderText width={80} height={26} />
      </Flex>
      <Flex>
        <Separator mx={1} />
      </Flex>
      <Flex flex={1} px="2">
        <Flex my="auto" alignItems="center">
          <PlaceholderText width={240} />
          <Spacer y={1} />
          <PlaceholderText width={230} />

          <PlaceholderText width={240} />

          <PlaceholderText width={200} />
          <PlaceholderText width={70} />
          <Spacer y={1} />

          <PlaceholderBox width={176} height={50} borderRadius={25} />
        </Flex>
      </Flex>
    </Flex>
  )
}
