/* tslint:disable */

import { ReaderFragment } from "relay-runtime";
import { ArtistShow_show$ref } from "./ArtistShow_show.graphql";
declare const _SmallList_shows$ref: unique symbol;
export type SmallList_shows$ref = typeof _SmallList_shows$ref;
export type SmallList_shows = ReadonlyArray<{
    readonly " $fragmentRefs": ArtistShow_show$ref;
    readonly " $refType": SmallList_shows$ref;
}>;



const node: ReaderFragment = {
  "kind": "Fragment",
  "name": "SmallList_shows",
  "type": "Show",
  "metadata": {
    "plural": true
  },
  "argumentDefinitions": [],
  "selections": [
    {
      "kind": "FragmentSpread",
      "name": "ArtistShow_show",
      "args": null
    }
  ]
};
(node as any).hash = 'abd963551ffe3b4b5c864508bd74e6ba';
export default node;
