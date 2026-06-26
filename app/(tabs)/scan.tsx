import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  Animated,
  Image,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  ChevronLeft,
  Camera as CameraIcon,
  CheckCircle,
  RefreshCw,
  SwitchCamera,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import * as Device from "expo-device";

import {
  Colors,
  FontSize,
  FontFamily,
  Radius,
  Spacing,
} from "@/constants/colors";
import {
  getLokasiAbsensi,
  createBarcodeAbsensi,
} from "@/services/absensi.service";
import { LokasiAbsensi } from "@/types/absensi";
import { useAuthStore } from "@/store/auth.store";

type ScanStep = "SCAN_BARCODE" | "TAKE_PHOTO" | "SUCCESS_PREVIEW";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [step, setStep] = useState<ScanStep>("SCAN_BARCODE");
  const [scanned, setScanned] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const user = useAuthStore((state) => state.user);

  // Locations State
  const [lokasiList, setLokasiList] = useState<LokasiAbsensi[]>([]);
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiAbsensi | null>(
    null,
  );

  // Scanned & Captured Employee State
  const [scannedPayload, setScannedPayload] = useState<{
    id_pegawai: number;
    qr_string: string;
  } | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("back");
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(
    null,
  );

  // API Response State
  const [absensiResult, setAbsensiResult] = useState<{
    nama_pegawai: string;
    waktu_absensi: string;
    tanggal: string;
    nama_lokasi: string;
    alamat_lokasi: string;
    foto_absensi: string;
  } | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Animation Loop for vertical scanning line (Only active during SCAN_BARCODE step)
  useEffect(() => {
    if (step !== "SCAN_BARCODE") return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scanAnim, step]);

  const resetScanWorkflow = () => {
    setStep("SCAN_BARCODE");
    setScanned(false);
    setScannedPayload(null);
    setCapturedPhotoUri(null);
    setCapturedPhotoBase64(null);
    setAbsensiResult(null);
    setCameraFacing("back");
  };

  const loadInitialData = useCallback(async () => {
    try {
      console.log("DEBUG: [loadInitialData] user?.id_lokasi_absen_default =", user?.id_lokasi_absen_default);
      const res = await getLokasiAbsensi();
      if (res && res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setLokasiList(list);

        if (list.length === 0) {
          setSelectedLokasi(null);
          return;
        }

        if (list.length === 1) {
          setSelectedLokasi(list[0]);
          return;
        }

        const defaultLokasiId = user?.id_lokasi_absen_default;
        if (defaultLokasiId) {
          const defaultLokasi = list.find(
            (item) => String(item.id_lokasi) === String(defaultLokasiId),
          );
          if (defaultLokasi) {
            setSelectedLokasi(defaultLokasi);
            return;
          }
        }

        setSelectedLokasi((prev) => {
          if (!prev) return list[0] || null;
          const existingSelected = list.find(
            (item) => String(item.id_lokasi) === String(prev.id_lokasi),
          );
          return existingSelected || list[0] || null;
        });
      }
    } catch (error) {
      console.error("Gagal mengambil lokasi absensi:", error);
    }
  }, [user?.id_lokasi_absen_default]);

  // Load locations on focus or default location change
  useFocusEffect(
    useCallback(() => {
      resetScanWorkflow();
      loadInitialData();
      setIsFocused(true);
      return () => {
        setIsFocused(false);
      };
    }, [loadInitialData]),
  );

  useEffect(() => {
    console.log("DEBUG: [useEffect default location] user?.id_lokasi_absen_default =", user?.id_lokasi_absen_default);
    if (isFocused) {
      loadInitialData();
    }
  }, [user?.id_lokasi_absen_default, loadInitialData, isFocused]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !selectedLokasi) return;
    setScanned(true);

    let id_pegawai = 0;
    let qr_string = data.trim();
    let nama_pegawai = "";

    try {
      const parsed = JSON.parse(data);
      if (parsed.id_pegawai) {
        id_pegawai = Number(parsed.id_pegawai);
      }
      if (parsed.qr_string) {
        qr_string = String(parsed.qr_string);
      }
      if (parsed.nama_pegawai) {
        nama_pegawai = String(parsed.nama_pegawai);
      } else if (parsed.nama) {
        nama_pegawai = String(parsed.nama);
      }
    } catch (e) {
      if (data.includes("|")) {
        const parts = data.split("|");
        for (const part of parts) {
          const cleanPart = part.trim();
          if (!cleanPart) continue;

          // 1. Cek apakah ini datetime (mengandung tanda ':' atau '-' format tanggal)
          const isDateTime = cleanPart.includes(":") || /\d{4}-\d{2}-\d{2}/.test(cleanPart);
          if (isDateTime) {
            continue; // Abaikan datetime
          }

          // 2. Cek apakah ini ID Pegawai (angka)
          const isNum = !isNaN(Number(cleanPart));
          if (isNum && id_pegawai === 0) {
            id_pegawai = Number(cleanPart);
            continue;
          }

          // 3. Jika bukan angka & bukan datetime, maka ini adalah Nama Pegawai!
          if (nama_pegawai === "") {
            nama_pegawai = cleanPart;
          }
        }
      } else if (!isNaN(Number(data))) {
        id_pegawai = Number(data);
      }
    }

    if (id_pegawai <= 0) {
      Alert.alert(
        "Barcode Tidak Valid",
        "Kode QR tidak mengandung ID Pegawai yang valid.",
        [{ text: "Coba Lagi", onPress: () => setScanned(false) }],
      );
      return;
    }

    // Show custom confirmation dialog before transitioning to TAKE_PHOTO
    Alert.alert(
      "Scan Barcode Berhasil",
      `Terimakasih, scan barcode atas nama ${nama_pegawai || "Karyawan"} berhasil oleh petugas ${user?.nama_pegawai || "Petugas"}.\n\nSelanjutnya, silahkan foto pegawai untuk verifikasi.`,
      [
        {
          text: "OK",
          onPress: () => {
            // Save payload details and advance to swafoto step
            setScannedPayload({ id_pegawai, qr_string });
            setStep("TAKE_PHOTO");
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current || !scannedPayload || !selectedLokasi || submitting)
      return;

    try {
      setSubmitting(true);

      // 1. Get GPS coordinates
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Izin Lokasi",
          "Aplikasi membutuhkan izin lokasi untuk melakukan absensi.",
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // 2. Capture Swafoto picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.2,
        base64: true,
      });

      if (!photo?.uri || !photo?.base64) {
        throw new Error("Gagal mengambil foto verifikasi pegawai.");
      }

      const finalBase64 = `data:image/jpeg;base64,${photo.base64}`;
      setCapturedPhotoUri(photo.uri);
      setCapturedPhotoBase64(finalBase64);

      // 3. Assemble device info
      const deviceInfo = [
        Device.brand || "Unknown Brand",
        Device.modelName || "Unknown Model",
        `${Device.osName || "Unknown OS"} ${Device.osVersion || ""}`.trim(),
      ].join(" | ");

      // 4. Send absensi barcode payload to the API service
      const res = await createBarcodeAbsensi({
        id_pegawai: scannedPayload.id_pegawai,
        id_lokasi: Number(selectedLokasi.id_lokasi),
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        foto_absensi: finalBase64,
        device_info: deviceInfo,
        qr_string: scannedPayload.qr_string,
      });

      if (!res.success) {
        throw new Error(res.message || "Gagal menyimpan absensi barcode.");
      }

      // 5. Store API result details and advance to preview step
      if (res.data) {
        setAbsensiResult({
          nama_pegawai: res.data.nama_pegawai,
          waktu_absensi:
            res.data.waktu_absensi || new Date().toLocaleTimeString("id-ID"),
          tanggal: res.data.tanggal || new Date().toLocaleDateString("id-ID"),
          nama_lokasi: res.data.nama_lokasi,
          alamat_lokasi: res.data.alamat_lokasi || "",
          foto_absensi: photo.uri,
        });
      }

      setStep("SUCCESS_PREVIEW");
    } catch (error: any) {
      console.log("ERROR SCAN BARCODE: ", error);
      const serverMessage = error?.response?.data?.message;
      Alert.alert(
        "Gagal Absensi",
        serverMessage ||
          error?.message ||
          "Terjadi kesalahan saat memproses absensi barcode pegawai.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 230],
  });

  const getHeaderTitle = () => {
    switch (step) {
      case "SCAN_BARCODE":
        return "Scan Barcode";
      case "TAKE_PHOTO":
        return "Foto Karyawan";
      case "SUCCESS_PREVIEW":
        return "Absensi Sukses";
    }
  };

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={step === "SUCCESS_PREVIEW" ? "dark-content" : "light-content"}
        backgroundColor={
          step === "SUCCESS_PREVIEW" ? Colors.neutral[0] : "transparent"
        }
        translucent
      />

      {/* Background Camera (Step 1 & Step 2) */}
      {isFocused && step !== "SUCCESS_PREVIEW" && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing={step === "SCAN_BARCODE" ? "back" : cameraFacing}
          onBarcodeScanned={
            step === "SCAN_BARCODE" && !scanned
              ? handleBarcodeScanned
              : undefined
          }
        />
      )}

      {/* Main HUD Overlays */}
      {step !== "SUCCESS_PREVIEW" ? (
        <View style={styles.overlayContainer}>
          {/* Header */}
          <View
            style={[
              styles.header,
              { height: 56 + insets.top, paddingTop: insets.top },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <ChevronLeft size={22} color={Colors.neutral[0]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
          </View>
          <View
            style={{
              backgroundColor: Colors.neutral[0],
              paddingVertical: Spacing[2],
              borderBottomWidth: 1,
              borderBottomColor: Colors.neutral[100],
            }}
          >
            <Text
              style={{
                fontSize: FontSize.sm,
                fontFamily: FontFamily.semibold,
                color: Colors.primary[500],
                textAlign: "center",
              }}
            >
              Lokasi Absen: {selectedLokasi?.nama_lokasi || "Memuat..."}
            </Text>
          </View>

          {step === "SCAN_BARCODE" ? (
            /* ==================== STEP 1: SCAN BARCODE ==================== */
            <View style={styles.workflowContainer}>
              <View style={styles.topOverlay} />
              {/* Scanning Frame HUD */}
              <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.scanAreaContainer}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                    <Animated.View
                      style={[styles.scanLine, { transform: [{ translateY }] }]}
                    />
                  </View>
                </View>
                <View style={styles.sideOverlay} />
              </View>
              <View style={styles.bottomOverlay} />

              {/* Instruction Banner */}
              <View style={styles.footerSection}>
                <Text style={styles.instructionText}>
                  Arahkan kamera ke QR Code{"\n"}atau barcode karyawan
                </Text>

                {!cameraPermission.granted ? (
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestCameraPermission}
                  >
                    <Text style={styles.permissionButtonText}>
                      Aktifkan Kamera
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : (
            /* ==================== STEP 2: TAKE PHOTO ==================== */
            <View style={styles.workflowContainer}>
              <View style={styles.topOverlay} />
              {/* Selfie Frame HUD Overlay */}
              <View style={styles.photoMiddleRow}>
                <View style={styles.photoSideOverlay} />
                <View style={styles.photoCaptureFrame}>
                  {submitting && (
                    <View style={styles.submittingOverlay}>
                      <ActivityIndicator
                        size="large"
                        color={Colors.neutral[0]}
                      />
                      <Text style={styles.submittingText}>
                        Menyimpan absensi...
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.photoSideOverlay} />
              </View>
              <View style={styles.bottomOverlay} />

              {/* Camera Controls Banner */}
              <View style={styles.photoFooterSection}>
                <Text style={styles.instructionText}>
                  Ambil foto karyawan untuk{"\n"}verifikasi absensi
                </Text>

                <View style={styles.actionRow}>
                  {/* Switch Front/Back Camera */}
                  <TouchableOpacity
                    style={styles.secondaryCircleBtn}
                    onPress={() =>
                      setCameraFacing(
                        cameraFacing === "back" ? "front" : "back",
                      )
                    }
                    disabled={submitting}
                  >
                    <SwitchCamera size={20} color={Colors.neutral[0]} />
                  </TouchableOpacity>

                  {/* Trigger Photo Capture */}
                  <TouchableOpacity
                    style={styles.captureBtn}
                    onPress={handleCapturePhoto}
                    disabled={submitting}
                  >
                    <CameraIcon size={30} color={Colors.neutral[0]} />
                  </TouchableOpacity>

                  {/* Reset/Cancel back to Scan Barcode */}
                  <TouchableOpacity
                    style={styles.secondaryCircleBtn}
                    onPress={resetScanWorkflow}
                    disabled={submitting}
                  >
                    <RefreshCw size={20} color={Colors.neutral[0]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        /* ==================== STEP 3: SUCCESS PREVIEW ==================== */
        <SafeAreaView
          style={styles.successSafeArea}
          edges={["top", "bottom", "left", "right"]}
        >
          {/* Header */}
          <View style={styles.successHeader}>
            <Text style={styles.successHeaderTitle}>Detail Absensi</Text>
          </View>

          {/* Main Success Container */}
          <ScrollView
            contentContainerStyle={styles.successScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successCard}>
              {/* Checked/Success Icon */}
              <View style={styles.successIconWrapper}>
                <CheckCircle size={48} color={Colors.success[500]} />
              </View>

              <Text style={styles.successTitle}>Absensi Berhasil</Text>
              <Text style={styles.successSubtitle}>
                Data absensi barcode telah sukses disimpan
              </Text>

              {/* Employee Captured Photo Preview */}
              {absensiResult?.foto_absensi && (
                <View style={styles.photoPreviewWrapper}>
                  <Image
                    source={{ uri: absensiResult.foto_absensi }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* Details table */}
              <View style={styles.detailsTable}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nama Karyawan</Text>
                  <Text style={styles.detailValue}>
                    {absensiResult?.nama_pegawai}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Waktu Absen</Text>
                  <Text style={styles.detailValue}>
                    {absensiResult?.waktu_absensi} WIB
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tanggal</Text>
                  <Text style={styles.detailValue}>
                    {absensiResult?.tanggal}
                  </Text>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lokasi</Text>
                  <Text style={styles.detailValue}>
                    {absensiResult?.nama_lokasi}
                  </Text>
                </View>
              </View>
            </View>

            {/* Finished Button back to step 1 */}
            <TouchableOpacity
              style={styles.finishBtn}
              onPress={resetScanWorkflow}
            >
              <Text style={styles.finishBtnText}>Pindai Karyawan Lain</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[900],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[900],
    justifyContent: "center",
    alignItems: "center",
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: Spacing[4],
    backgroundColor: "rgba(15, 25, 35, 0.85)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(238, 242, 246, 0.1)",
  },
  backBtn: {
    marginRight: Spacing[4],
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[0],
  },
  workflowContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 25, 35, 0.85)",
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 25, 35, 0.85)",
  },

  /* Location dropdown styling */
  locationHudWrapper: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    backgroundColor: "rgba(15, 25, 35, 0.85)",
    zIndex: 10,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  locationText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
    flex: 1,
  },
  dropdownMenu: {
    position: "absolute",
    top: 56 + Spacing[4],
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    overflow: "hidden",
    zIndex: 20,
  },
  dropdownItem: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  dropdownItemText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.neutral[900],
  },

  /* Centered Scan Area Frame */
  middleRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 240,
  },
  sideOverlay: {
    flex: 1,
    height: "100%",
    backgroundColor: "rgba(15, 25, 35, 0.85)",
  },
  scanAreaContainer: {
    width: 240,
    height: 240,
    backgroundColor: "transparent",
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: Radius.xl,
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: Colors.primary[500],
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    height: 3,
    backgroundColor: Colors.primary[500],
    width: "90%",
    alignSelf: "center",
  },
  footerSection: {
    backgroundColor: "rgba(15, 25, 35, 0.85)",
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    alignItems: "center",
  },
  instructionText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.neutral[0],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing[6],
  },
  permissionButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.md,
  },
  permissionButtonText: {
    color: Colors.neutral[0],
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
  },

  /* ==================== STEP 2: PHOTO HUD STYLING ==================== */
  photoMiddleRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 280,
  },
  photoSideOverlay: {
    flex: 1,
    height: "100%",
    backgroundColor: "rgba(15, 25, 35, 0.85)",
  },
  photoCaptureFrame: {
    width: 280,
    height: 280,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.neutral[0],
    backgroundColor: "transparent",
    overflow: "hidden",
    position: "relative",
  },
  submittingOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(15, 25, 35, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing[4],
  },
  submittingText: {
    color: Colors.neutral[0],
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    marginTop: Spacing[3],
  },
  photoFooterSection: {
    backgroundColor: "rgba(15, 25, 35, 0.85)",
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[6],
  },
  secondaryCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(15, 25, 35, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },

  /* ==================== STEP 3: SUCCESS SCREEN STYLING ==================== */
  successSafeArea: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
  },
  successHeader: {
    height: 56,
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    justifyContent: "center",
  },
  successHeaderTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
  },
  successScroll: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  successCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    padding: Spacing[4],
    alignItems: "center",
    marginBottom: Spacing[5],
  },
  successIconWrapper: {
    marginBottom: Spacing[3],
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.neutral[900],
  },
  successSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[500],
    marginTop: Spacing[1],
    marginBottom: Spacing[5],
    textAlign: "center",
  },
  photoPreviewWrapper: {
    width: 140,
    height: 140,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    marginBottom: Spacing[5],
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  detailsTable: {
    width: "100%",
    backgroundColor: Colors.neutral[50],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing[3],
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[700],
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing[4],
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },
  finishBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: Radius.md,
    paddingVertical: Spacing[3] + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtnText: {
    color: Colors.neutral[0],
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.md,
  },
});
