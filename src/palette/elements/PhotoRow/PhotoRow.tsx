import { Photo } from "app/Scenes/SubmitArtwork/UploadPhotos/validation"
import { PlaceholderBox, ProvidePlaceholderContext } from "app/utils/placeholders"
import { Button, Flex, ProgressBar, Spacer, Text } from "palette"
import React from "react"
import { Image } from "react-native"

interface PhotoRowContainerProps {
  error?: boolean
  errorMsg?: string
}

const PhotoRowContainer: React.FC<PhotoRowContainerProps> = ({ error, errorMsg, children }) => (
  <>
    <Flex
      p={1}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      style={{
        borderColor: error ? "#C82400" : "lightgray",
        borderWidth: 1,
        borderRadius: 4,
        height: 68,
      }}
    >
      {children}
    </Flex>
    {error && errorMsg && (
      <Text variant="xs" color="red100">
        {errorMsg}
      </Text>
    )}
    <Spacer mt={2} />
  </>
)

const PhotoRowPlaceholder = ({ progress }: { progress: number }) => (
  <PhotoRowContainer>
    <ProvidePlaceholderContext>
      <Flex flexDirection="row">
        <Flex width="18%" justifyContent="center">
          <PlaceholderBox testID="Submission_Photo_Placeholder" width={48} height={48} />
        </Flex>
        <Flex
          flexDirection="row"
          width="80%"
          alignItems="center"
          justifyContent="space-around"
          marginLeft={0.5}
        >
          <ProgressBar progress={progress} />
        </Flex>
      </Flex>
    </ProvidePlaceholderContext>
  </PhotoRowContainer>
)
interface PhotoRowProps {
  photo: Photo
  onPhotoDelete: (arg: Photo) => void
  progress: number
}

export const PhotoRow = ({ photo, onPhotoDelete, progress }: PhotoRowProps) => {
  if (photo.loading) {
    return <PhotoRowPlaceholder progress={progress} />
  }

  return (
    <PhotoRowContainer error={photo.error} errorMsg={photo.errorMessage}>
      <Flex alignItems="center">
        <Image
          style={{ height: 48, width: 48 }}
          resizeMode="cover"
          source={{ uri: photo.path }}
          testID="Submission_Image"
        />
      </Flex>
      <Flex flexDirection="row" alignItems="center">
        <Text>{photo.sizeDisplayValue}</Text>
        <Button
          ml={1}
          variant="text"
          size="small"
          onPress={() => onPhotoDelete(photo)}
          testID="Submission_Delete_Photo_Button"
        >
          <Text style={{ textDecorationLine: "underline" }}>Delete</Text>
        </Button>
      </Flex>
    </PhotoRowContainer>
  )
}
