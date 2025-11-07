import {useMemo, useState} from 'react';
import {appIcons, responsiveWidth} from '../../../../services';

export function useHooks() {
  const [SearchModal, setSearchModal] = useState(false);
  const HandleSearchModal = () => {
    //console.log('hi');
    setSearchModal(!SearchModal);
  };

  const TopRightButtonsData = useMemo(
    () => [
      {
        IconName: appIcons.Location,
        customPadding: responsiveWidth(2.5),
        isWithBorder: true,
        onPress: () => {
          // Diese Funktion wird von der Hauptkomponente überschrieben
        },
      },
    ],
    [],
  );
  return {TopRightButtonsData, SearchModal, HandleSearchModal};
}
