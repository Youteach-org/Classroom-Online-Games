// DEA educativo: instalador/flashador SIN descargas en la computadora del usuario.
// El firmware y esptool se incorporan en el EXE durante GitHub Actions.
package main

import (
 "archive/zip"
 "bytes"
 "crypto/sha256"
 "embed"
 "encoding/hex"
 "errors"
 "fmt"
 "io"
 "os"
 "os/exec"
 "path/filepath"
 "regexp"
 "strings"
 "syscall"

 "github.com/lxn/walk"
 . "github.com/lxn/walk/declarative"
)

//go:embed payload.zip
var packed embed.FS

const installedName = "DEA_Actualizador_Permanente.exe"
const shortcutName = "DEA - Actualizar.lnk"

func appDirectory() (string, error) {
 root := os.Getenv("LOCALAPPDATA")
 if root == "" { return "", errors.New("Windows no definió LOCALAPPDATA") }
 return filepath.Join(root, "DEA-Actualizador"), nil
}

func quotedPowerShell(s string) string { return "'" + strings.ReplaceAll(s, "'", "''") + "'" }

func createShortcut(exe, dir string) error {
 root := os.Getenv("APPDATA")
 if root == "" { return errors.New("Windows no definió APPDATA") }
 startMenu := filepath.Join(root, "Microsoft", "Windows", "Start Menu", "Programs", shortcutName)
 // Windows may redirect Desktop into OneDrive; ask Windows for the actual folder.
 script := fmt.Sprintf("$w=New-Object -ComObject WScript.Shell; $locations=@(%s); $desktop=[Environment]::GetFolderPath('Desktop'); if($desktop) {$locations += (Join-Path $desktop %s)}; foreach($p in $locations) {$s=$w.CreateShortcut($p); $s.TargetPath=%s; $s.WorkingDirectory=%s; $s.Save()}", quotedPowerShell(startMenu), quotedPowerShell(shortcutName), quotedPowerShell(exe), quotedPowerShell(dir))
 output, err := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script).CombinedOutput()
 if err != nil { return fmt.Errorf("No se pudieron crear accesos directos: %w: %s", err, strings.TrimSpace(string(output))) }
 return nil
}

func installIfNeeded() (bool, error) {
 dir, err := appDirectory()
 if err != nil { return false, err }
 current, err := os.Executable()
 if err != nil { return false, err }
 destination := filepath.Join(dir, installedName)
 if strings.EqualFold(filepath.Clean(current), filepath.Clean(destination)) { return false, nil }
 if err := os.MkdirAll(dir, 0755); err != nil { return false, err }
 in, err := os.Open(current)
 if err != nil { return false, err }
 defer in.Close()
 tmp := destination + ".nuevo"
 out, err := os.OpenFile(tmp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0700)
 if err != nil { return false, err }
 _, copyErr := io.Copy(out, in)
 closeErr := out.Close()
 if copyErr != nil { return false, copyErr }
 if closeErr != nil { return false, closeErr }
 if err := os.Rename(tmp, destination); err != nil { return false, fmt.Errorf("Cierra primero el actualizador anterior: %w", err) }
 if err := createShortcut(destination, dir); err != nil { return false, err }
 if err := exec.Command(destination, "--run").Start(); err != nil { return false, err }
 return true, nil
}

func ensurePayload() (string, string, error) {
 data, err := packed.ReadFile("payload.zip")
 if err != nil { return "", "", err }
 hash := sha256.Sum256(data)
 id := hex.EncodeToString(hash[:6])
 dir, err := appDirectory()
 if err != nil { return "", "", err }
 target := filepath.Join(dir, "paquete-"+id)
 marker := filepath.Join(target, "completo.ok")
 if _, err := os.Stat(marker); err == nil {
  tool, e := findFile(target, "esptool.exe")
  firmware := filepath.Join(target, "firmware.merged.bin")
  if e == nil { if _, err := os.Stat(firmware); err == nil { return tool, firmware, nil } }
 }
 if err := os.MkdirAll(target, 0755); err != nil { return "", "", err }
 archive, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
 if err != nil { return "", "", err }
 for _, item := range archive.File {
  clean := filepath.Clean(item.Name)
  if filepath.IsAbs(clean) || strings.HasPrefix(clean, "..") { return "", "", fmt.Errorf("Ruta insegura en paquete: %q", item.Name) }
  path := filepath.Join(target, clean)
  if item.FileInfo().IsDir() { if err := os.MkdirAll(path, 0755); err != nil { return "", "", err }; continue }
  if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil { return "", "", err }
  input, err := item.Open()
  if err != nil { return "", "", err }
  output, err := os.OpenFile(path, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0700)
  if err != nil { input.Close(); return "", "", err }
  _, copyErr := io.Copy(output, input)
  input.Close()
  closeErr := output.Close()
  if copyErr != nil { return "", "", copyErr }
  if closeErr != nil { return "", "", closeErr }
 }
 tool, err := findFile(target, "esptool.exe")
 if err != nil { return "", "", err }
 firmware := filepath.Join(target, "firmware.merged.bin")
 if stat, err := os.Stat(firmware); err != nil || stat.Size() == 0 { return "", "", errors.New("El paquete no contiene firmware válido") }
 if err := os.WriteFile(marker, []byte("paquete verificado\n"), 0600); err != nil { return "", "", err }
 return tool, firmware, nil
}

func findFile(root, name string) (string, error) {
 var found string
 err := filepath.Walk(root, func(p string, info os.FileInfo, err error) error {
  if err != nil { return err }
  if !info.IsDir() && strings.EqualFold(info.Name(), name) { found=p; return filepath.SkipAll }
  return nil
 })
 if err != nil { return "", err }
 if found == "" { return "", fmt.Errorf("%s no existe en el paquete", name) }
 return found, nil
}

var comRegex = regexp.MustCompile(`(?i)\bCOM[0-9]{1,3}\b`)
func detectedPorts() []string {
 output, err := exec.Command("reg.exe", "query", `HKLM\HARDWARE\DEVICEMAP\SERIALCOMM`).CombinedOutput()
 if err != nil { return nil }
 seen:=map[string]bool{}
 ports:=[]string{}
 for _, port:= range comRegex.FindAllString(string(output), -1) {
  port=strings.ToUpper(port)
  if !seen[port] { seen[port]=true; ports=append(ports,port) }
 }
 return ports
}

func launch() error {
 var mw *walk.MainWindow
 var portInput *walk.LineEdit
 var logText *walk.TextEdit
 var startButton *walk.PushButton
 var status *walk.Label
 detected:=detectedPorts()
 initial:=""
 if len(detected)>0 { initial=detected[0] }
 var appendLog = func(line string) {
  if len(line)>240 { line=line[:240] }
  mw.Synchronize(func() { logText.SetText(logText.Text()+line+"\r\n") })
 }
 flash := func() {
  port:=strings.ToUpper(strings.TrimSpace(portInput.Text()))
  if !comRegex.MatchString(port) || !strings.EqualFold(comRegex.FindString(port),port) {
   walk.MsgBox(mw, "DEA", "Indica un puerto válido, por ejemplo COM3.", walk.MsgBoxIconWarning)
   return
  }
  yes:=walk.MsgBox(mw, "Confirmar instalación", "¿Grabar el firmware educativo del DEA en "+port+"? Esto reemplaza el firmware actual de esa placa.", walk.MsgBoxYesNo|walk.MsgBoxIconQuestion)
  if yes!=walk.DlgCmdYes { return }
  startButton.SetEnabled(false)
  status.SetText("Preparando archivos locales (sin Internet)...")
  go func() {
   tool, firmware, err:=ensurePayload()
   if err==nil {
    appendLog("Paquete local listo. Iniciando grabación por USB en "+port)
    cmd:=exec.Command(tool,"--chip","esp32s3","--port",port,"--baud","460800","--before","default-reset","--after","hard-reset","write-flash","0x0",firmware)
    cmd.SysProcAttr=&syscall.SysProcAttr{HideWindow:true}
    reader, writer:=io.Pipe()
    cmd.Stdout=writer
    cmd.Stderr=writer
    done:=make(chan struct{})
    go func() {
     defer close(done)
     buf:=make([]byte,1024)
     for {
      n,e:=reader.Read(buf)
      if n>0 { appendLog(string(buf[:n])) }
      if e!=nil { break }
     }
    }()
    err=cmd.Run()
    writer.Close()
    <-done
   }
   mw.Synchronize(func() {
    startButton.SetEnabled(true)
    if err!=nil {
     status.SetText("Error: revisa el registro.")
     walk.MsgBox(mw,"DEA — Error",err.Error(),walk.MsgBoxIconError)
    }else{
     status.SetText("V15 grabado. Verifica sonido y las 32 pantallas.")
     walk.MsgBox(mw,"DEA","V15 instalado en la ESP32-S3. Comprueba pantalla y audio en el equipo físico.",walk.MsgBoxIconInformation)
    }
   })
  }()
 }
 _, err:=MainWindow{
  AssignTo:&mw, Title:"DEA V15 — Instalador permanente",
  MinSize:Size{640,420}, Size:Size{750,500},
  Layout:VBox{},
  Children:[]Widget{
   Label{Text:"V15 completo · 32 pantallas · 3 botones · volumen inicial 100%"},
   Label{Text:"Incluye el firmware compilado y la herramienta USB. No instala ni descarga Arduino."},
   Composite{Layout:HBox{},Children:[]Widget{
    Label{Text:"Puerto de la ESP32-S3:"},
    LineEdit{AssignTo:&portInput,Text:initial},
    PushButton{Text:"Detectar puertos",OnClicked:func(){
     ports:=detectedPorts()
     if len(ports)>0 {portInput.SetText(ports[0]);walk.MsgBox(mw,"Puertos detectados",strings.Join(ports,", "),walk.MsgBoxIconInformation)}else{walk.MsgBox(mw,"DEA","No se detectaron puertos COM.",walk.MsgBoxIconWarning)}
    }},
   }},
   PushButton{AssignTo:&startButton,Text:"INSTALAR FIRMWARE EN LA PLACA",OnClicked:flash},
   Label{AssignTo:&status,Text:"Listo. Conecta la placa por USB y verifica el puerto COM."},
   TextEdit{AssignTo:&logText,ReadOnly:true,VScroll:true},
  },
 }.Run()
 return err
}

// La CI de Windows usa esta opción para comprobar el EXE sin conectar una placa.
func selfTest() error {
 tool, firmware, err := ensurePayload()
 if err != nil { return err }
 if stat, err := os.Stat(firmware); err != nil || stat.Size() < 100000 {
  return errors.New("El firmware incorporado no es válido")
 }
 cmd := exec.Command(tool, "--help")
 cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow:true}
 output, err := cmd.CombinedOutput()
 if err != nil { return fmt.Errorf("Esptool incorporado no se ejecuta: %w: %s", err, string(output)) }
 if !strings.Contains(strings.ToLower(string(output)), "esptool") {
  return fmt.Errorf("Versión inesperada de flasher: %s", string(output))
 }
 return nil
}

func main() {
 if len(os.Args)>1 && os.Args[1]=="--self-test" {
  if err:=selfTest(); err!=nil {
   if dir,e:=appDirectory(); e==nil {
    _=os.MkdirAll(dir,0755)
    _=os.WriteFile(filepath.Join(dir,"selftest-error.txt"),[]byte(err.Error()),0600)
   }
   os.Exit(1)
  }
  return
 }
 if len(os.Args)==1 {
  started,err:=installIfNeeded()
  if err!=nil { walk.MsgBox(nil,"DEA — Instalación",err.Error(),walk.MsgBoxIconError);return }
  if started { return }
 }
 if err:=launch(); err!=nil { walk.MsgBox(nil,"DEA — Error",err.Error(),walk.MsgBoxIconError) }
}
