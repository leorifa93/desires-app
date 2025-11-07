import React, {useState, useRef, useEffect} from 'react';
import {View, StyleSheet, Dimensions, Platform, SafeAreaView, TouchableOpacity} from 'react-native';
import Video from 'react-native-video';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import {scale} from 'react-native-size-matters';
import {Wrapper, Text, Buttons, Spacer, Icons} from './index';
import {colors, responsiveHeight, responsiveWidth, fontSizes, appIcons} from '../services';
import {useTranslation} from 'react-i18next';

const {width} = Dimensions.get('window');

const VideoTrimmer = ({videoUri, onTrim, onCancel, maxDuration = 60}) => {
  const {t} = useTranslation();
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (duration > 0 && endTime === 0) {
      // Set end time to min of duration or maxDuration
      setEndTime(Math.min(duration, maxDuration));
    }
  }, [duration]);

  const onLoad = (data) => {
    console.log('Video loaded with data:', data);
    const videoDuration = data.duration;
    setDuration(videoDuration);
    setEndTime(Math.min(videoDuration, maxDuration));
    setIsVideoLoaded(true);
  };

  const onProgress = (data) => {
    const current = data.currentTime;
    setCurrentTime(current);
    
    // Stop at endTime
    if (current >= endTime && isPlaying) {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.seek(startTime);
      }
    }
  };

  const handleSliderChange = (values) => {
    const [newStart, newEnd] = values;
    
    // Einfach die Werte setzen während des Ziehens
    setStartTime(newStart);
    setEndTime(newEnd);
  };

  const handleSliderChangeFinish = (values) => {
    let [newStart, newEnd] = values;
    
    // Nach dem Loslassen prüfen und korrigieren
    const diff = newEnd - newStart;
    
    if (diff > maxDuration) {
      // Prüfe welcher Handle bewegt wurde
      const startMoved = Math.abs(newStart - startTime) > Math.abs(newEnd - endTime);
      
      if (startMoved) {
        // Start wurde bewegt, passe End an
        newEnd = Math.min(newStart + maxDuration, duration);
      } else {
        // End wurde bewegt, passe Start an
        newStart = Math.max(newEnd - maxDuration, 0);
      }
      
      setStartTime(newStart);
      setEndTime(newEnd);
    }
    
    if (videoRef.current && !isPlaying) {
      videoRef.current.seek(newStart);
    }
  };

  const togglePlay = () => {
    if (!isPlaying && videoRef.current) {
      videoRef.current.seek(startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrim = () => {
    const trimDuration = endTime - startTime;
    console.log('Trim duration:', trimDuration, 'Max duration:', maxDuration);
    
    if (trimDuration > maxDuration) {
      alert(`Video kann maximal ${maxDuration} Sekunden lang sein`);
      return;
    }
    
    if (trimDuration <= 0) {
      alert('Bitte wähle einen gültigen Video-Bereich aus');
      return;
    }
    
    console.log('Trimming video from', startTime, 'to', endTime, '=', trimDuration, 'seconds');
    
    onTrim({
      startTime,
      endTime,
      duration: trimDuration,
      originalUri: videoUri,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const trimDuration = endTime - startTime;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Wrapper style={styles.container}>
        <Wrapper style={styles.headerRow}>
          <Text style={styles.title}>{t('TRIM_VIDEO')}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onCancel}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </Wrapper>
        
        <Wrapper style={styles.header}>
          <Text style={styles.subtitle}>
            {t('SELECT_UP_TO')} {maxDuration} {t('SECONDS')}
          </Text>
        </Wrapper>

        <Spacer isSmall />

        <Wrapper style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{uri: videoUri}}
          style={styles.video}
          resizeMode="contain"
          paused={!isPlaying}
          onLoad={onLoad}
          onProgress={onProgress}
          repeat={false}
        />
      </Wrapper>

      <Spacer isSmall />

      <Wrapper style={styles.controls}>
        {!isVideoLoaded ? (
          <Wrapper style={{alignItems: 'center', padding: scale(20)}}>
            <Text style={styles.label}>{t('LOADING')}...</Text>
          </Wrapper>
        ) : (
          <>
            <Wrapper style={styles.timeRow}>
              <Text style={styles.timeText}>{t('START')}: {formatTime(startTime)}</Text>
              <Text style={styles.timeText}>{t('END')}: {formatTime(endTime)}</Text>
            </Wrapper>

            <Wrapper style={styles.sliderContainer}>
              <Text style={styles.label}>{t('SELECT_VIDEO_RANGE')}</Text>
              {duration > 0 && (
                <MultiSlider
                  values={[startTime, endTime]}
                  min={0}
                  max={duration}
                  step={0.1}
                  onValuesChange={handleSliderChange}
                  onValuesChangeFinish={handleSliderChangeFinish}
                  enabledOne={true}
                  enabledTwo={true}
                  allowOverlap={false}
                  snapped={true}
                  selectedStyle={{
                    backgroundColor: colors.appColor1,
                  }}
                  unselectedStyle={{
                    backgroundColor: colors.appTextColor6,
                  }}
                  markerStyle={{
                    backgroundColor: colors.appColor1,
                    height: scale(24),
                    width: scale(24),
                    borderRadius: scale(12),
                  }}
                  sliderLength={responsiveWidth(80)}
                  containerStyle={styles.multiSliderContainer}
                />
              )}
            </Wrapper>

            <Wrapper style={styles.durationInfo}>
              <Text style={styles.durationText}>
                {t('SELECTED_DURATION')}: {formatTime(trimDuration)}
              </Text>
              {trimDuration > maxDuration && (
                <Text style={styles.warningText}>
                  {t('EXCEEDS_MAX_DURATION')}
                </Text>
              )}
            </Wrapper>
          </>
        )}
      </Wrapper>

      <Spacer isSmall />

      <Wrapper style={styles.buttonContainer}>
        <Buttons.Colored
          text={isPlaying ? t('PAUSE') : t('PLAY')}
          onPress={togglePlay}
          disabled={!isVideoLoaded}
          buttonStyle={styles.playButton}
          textStyle={styles.playButtonText}
        />
        
        <Spacer isSmall />
        
        <Buttons.Colored
          text={t('USE_VIDEO')}
          onPress={handleTrim}
          disabled={!isVideoLoaded || trimDuration > maxDuration || trimDuration === 0}
        />
      </Wrapper>
      </Wrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.appBgColor1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.appBgColor1,
    padding: scale(20),
    paddingBottom: scale(40),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: scale(10),
  },
  header: {
    alignItems: 'center',
    marginTop: scale(5),
  },
  title: {
    fontSize: fontSizes.h5,
    color: colors.appTextColor1,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: fontSizes.regular,
    color: colors.appTextColor6,
    marginTop: scale(5),
  },
  closeButton: {
    padding: scale(8),
  },
  closeButtonText: {
    fontSize: scale(32),
    color: colors.appTextColor1,
    fontWeight: '300',
  },
  videoContainer: {
    width: '100%',
    height: responsiveHeight(40),
    backgroundColor: colors.appBgColor2,
    borderRadius: scale(10),
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(15),
  },
  timeText: {
    fontSize: fontSizes.regular,
    color: colors.appTextColor1,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: scale(15),
    alignItems: 'center',
  },
  label: {
    fontSize: fontSizes.small,
    color: colors.appTextColor6,
    marginBottom: scale(15),
  },
  multiSliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: scale(10),
  },
  durationInfo: {
    alignItems: 'center',
    marginTop: scale(10),
  },
  durationText: {
    fontSize: fontSizes.regular,
    color: colors.appTextColor1,
    fontWeight: '600',
  },
  warningText: {
    fontSize: fontSizes.small,
    color: colors.appColor1,
    marginTop: scale(5),
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
  },
  playButton: {
    backgroundColor: colors.appBgColor2,
    borderWidth: 1,
    borderColor: colors.appColor1,
  },
  playButtonText: {
    color: colors.appTextColor1,
  },
});

export default VideoTrimmer;

